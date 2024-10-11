use reqwest::header::AUTHORIZATION;
use serde::{de, Deserialize, Deserializer, Serialize};
use serde_json::{json, Value};
use std::{
    fmt, fs,
    path::{Path, PathBuf},
};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            read_discord_backup,
            delete_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn string_or_number<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    struct StringOrNumberVisitor;

    impl<'de> de::Visitor<'de> for StringOrNumberVisitor {
        type Value = String;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("string or number")
        }

        fn visit_str<E>(self, value: &str) -> Result<String, E>
        where
            E: de::Error,
        {
            Ok(value.to_string())
        }

        fn visit_u64<E>(self, value: u64) -> Result<String, E>
        where
            E: de::Error,
        {
            Ok(value.to_string())
        }
    }

    deserializer.deserialize_any(StringOrNumberVisitor)
}

#[derive(Deserialize, Debug)]
struct Channel {
    #[serde(deserialize_with = "string_or_number")]
    id: String, // Channel IDs might be large integers, so handle as strings
    #[serde(rename = "type")]
    channel_type: String,
    recipients: Option<Vec<String>>,
}

#[derive(Deserialize, Serialize, Debug)]
struct Message {
    #[serde(deserialize_with = "string_or_number")]
    ID: String, // Message IDs might also be large integers
    Timestamp: String,
    Contents: String,
    Attachments: Option<String>,
}

#[derive(Serialize, Debug)]
struct DmChat {
    id: String,
    recipient_id: String,
    recipient_name: String,
    messages: Vec<Message>,
}

#[derive(Serialize, Debug)]
struct GuildChat {
    id: String,
    messages: Vec<Message>,
}

#[derive(Serialize, Debug)]
struct DiscordBackup {
    dms: Vec<DmChat>,
    guilds: Vec<GuildChat>,
}

fn get_or_create_deleted_messages_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    // Get the application data directory
    let app_data_path = app_handle.path().app_data_dir().unwrap();

    // Ensure the directory exists
    if !app_data_path.exists() {
        fs::create_dir_all(&app_data_path).map_err(|e| e.to_string())?;
    }

    // Return the path to the JSON file
    Ok(app_data_path.join("deleted_messages.json"))
}

#[tauri::command]
async fn delete_message(
    app_handle: tauri::AppHandle,
    token: String,
    channel_id: String,
    message_id: String,
) -> Result<u16, String> {
    let url = format!(
        "https://discord.com/api/v9/channels/{}/messages/{}",
        channel_id, message_id
    );

    let client = reqwest::Client::new();
    let response = client
        .delete(&url)
        .header(AUTHORIZATION, token)
        .send()
        .await;

    let json_path = get_or_create_deleted_messages_path(&app_handle)?;

    match response {
        Ok(resp) => {
            let status_code = resp.status().as_u16();
            if status_code == 404 || (status_code >= 200 && status_code < 300) {
                // Ensure the JSON file exists and is initialized
                if !json_path.exists() {
                    // Create the JSON file with initial structure
                    let initial_data = json!({ "deleted_messages": [] });
                    fs::write(
                        &json_path,
                        serde_json::to_string_pretty(&initial_data).map_err(|e| e.to_string())?,
                    )
                    .map_err(|e| e.to_string())?;
                }

                // Log deleted message to the JSON file
                let mut deleted_messages = vec![];

                // Read existing entries
                if let Ok(data) = fs::read_to_string(&json_path) {
                    let json_data: Value =
                        serde_json::from_str(&data).map_err(|e| e.to_string())?;
                    if let Some(messages) = json_data["deleted_messages"].as_array() {
                        deleted_messages.extend(messages.clone());
                    }
                }

                // Add the new deleted message
                deleted_messages.push(json!({
                    "channel_id": channel_id,
                    "message_id": message_id,
                }));

                // Write back to the JSON file
                let json_output = json!({ "deleted_messages": deleted_messages });
                fs::write(
                    &json_path,
                    serde_json::to_string_pretty(&json_output).map_err(|e| e.to_string())?,
                )
                .map_err(|e| e.to_string())?;
            }
            Ok(status_code) // Return the status code
        }
        Err(_) => Err("Error deleting the message".into()), // Handle errors
    }
}

#[tauri::command]
fn read_discord_backup(
    app_handle: tauri::AppHandle,
    directory: String,
) -> Result<DiscordBackup, String> {
    let path = Path::new(&directory);
    if !path.is_dir() {
        return Err("Provided directory is not valid".to_string());
    }

    // Get the path of the JSON file next to the executable
    let json_path = get_or_create_deleted_messages_path(&app_handle)?;

    // Load deleted messages from JSON file
    let mut deleted_message_ids = vec![];

    if json_path.exists() {
        let data = fs::read_to_string(&json_path).map_err(|e| e.to_string())?;
        let json_data: serde_json::Value =
            serde_json::from_str(&data).map_err(|e| e.to_string())?;
        if let Some(messages) = json_data["deleted_messages"].as_array() {
            deleted_message_ids.extend(
                messages
                    .iter()
                    .map(|msg| msg["message_id"].as_str().unwrap_or("").to_string()),
            );
        }
    }

    let mut dms = Vec::new();
    let mut guilds = Vec::new();

    for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let chat_path = entry.path();

        if chat_path.is_dir() {
            let channel_file = chat_path.join("channel.json");
            let messages_file = chat_path.join("messages.json");

            // Read and parse channel.json
            let channel_data = fs::read_to_string(channel_file).map_err(|e| e.to_string())?;
            let channel: Channel =
                serde_json::from_str(&channel_data).map_err(|e| e.to_string())?;

            // Read and parse messages.json
            let messages_data = fs::read_to_string(messages_file).map_err(|e| e.to_string())?;
            let mut messages: Vec<Message> =
                serde_json::from_str(&messages_data).map_err(|e| e.to_string())?;

            // Filter out deleted messages
            messages.retain(|msg| !deleted_message_ids.contains(&msg.ID));

            // Sort messages based on channel type
            if channel.channel_type == "DM" {
                // Extract recipient data for DM
                if let Some(recipients) = channel.recipients {
                    if recipients.len() == 2 {
                        let recipient_name = if recipients[0] == "Deleted User" {
                            recipients[1].clone()
                        } else {
                            recipients[0].clone()
                        };
                        dms.push(DmChat {
                            id: channel.id.clone(),
                            recipient_id: recipients[1].clone(),
                            recipient_name,
                            messages,
                        });
                    }
                }
            } else if channel.channel_type == "GUILD_TEXT" {
                guilds.push(GuildChat {
                    id: channel.id.clone(),
                    messages,
                });
            }
        }
    }

    Ok(DiscordBackup { dms, guilds })
}
