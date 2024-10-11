<p align="center">  
  
<img src="https://github.com/user-attachments/assets/a5a943fa-e404-4378-afe4-f696acc7dbad">

</p>

# Discappear - A tool to wipe your Discord sins
<p align="center">  

<img src="/public/tauri-badge.png">

</p>

What if you wanted to delete some of your Discord messages, but you can't be bothered searching through all channels and DMs?

What if you don't want anybody to know that you sent 'I love Javascript' to that one channel in 2016.

Well, say no more. Discappear is here.

This is a lightweight desktop app built with Rust and Typescript, using Tauri. It's simple, but it does its job.

## How do I use this?

Good of you to ask.

1. Download the latest release from the [releases page](https://github.com/omznc/discappear/releases)

2. Get your Discord token and data exports (the app has guides for both)

3. Run the app and follow the instructions

## How does it work?

The app uses the Discord API to get all your messages, and then uses a simple configurable filter to decide which messages to delete, with a preview of the message before it's deleted.

## Note

Discord doesn't allow you to delete messages from servers you're not in, so if you got kicked, whoops.

---

You can grab the windows/linux release under releases, or just build it yourself - you paranoid person:

1. Install deps
```
bun install
```

2. Build
```
bunx tauri build
```

![image](https://github.com/user-attachments/assets/0bfa4720-8e70-43c1-b30e-ba66e37f0990)

![image](https://github.com/user-attachments/assets/d149c7cc-ad03-473d-8852-fa067b91059b)
