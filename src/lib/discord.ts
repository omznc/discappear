export const getCurrentUser = async (token: string) => {
	const response = await fetch("https://discord.com/api/v10/users/@me", {
		headers: {
			Authorization: token,
		},
	});
	if (response.status === 200) {
		const user = await response.json();
		return {
			username: user.username,
			avatarURL: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
			token,
		} as User;
	}
};

export interface User {
	username: string;
	avatarURL: string;
	token: string;
}

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
