export interface User {
	username: string;
	avatarURL: string;
	token: string;
}

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
