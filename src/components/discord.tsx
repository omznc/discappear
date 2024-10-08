// Mocked types
export interface Message {
	ID: string;
	Timestamp: string;
	Contents: string;
	Attachments: string;
}

export interface DmChat {
	id: string;
	recipient_id: string;
	recipient_name: string;
	messages: Message[];
}

export interface GuildChat {
	id: string;
	messages: Message[];
}

export interface DiscordBackup {
	dms: DmChat[];
	guilds: GuildChat[];
}
