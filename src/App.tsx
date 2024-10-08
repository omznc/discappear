import type { User } from "@/lib/discord";
import "./App.css";
import { useState, useMemo, type Dispatch, type SetStateAction } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TitleBar } from "@/components/title-bar";
import { Auth } from "@/components/auth";
import { PathInput } from "@/components/path-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DiscordBackup, Message } from "@/components/discord";
import { invoke } from "@tauri-apps/api/core";
import { FilterForm, type Filter } from "@/components/filters";

export default function App() {
	const [user, setUser] = useState<User | null>(null);
	const [data, setData] = useState<DiscordBackup | null>(null);
	const [path, setPath] = useState("");

	return (
		<main className="flex flex-col items-center justify-start h-screen pt-[30px]">
			<TitleBar user={user} />
			<div className="h-full w-full flex flex-col items-center justify-center">
				{!user && <Auth setUser={setUser} />}
				{user &&
					(data ? (
						<Content user={user} data={data} setData={setData} path={path} />
					) : (
						<PathInput setData={setData} setPath={setPath} />
					))}
			</div>
		</main>
	);
}

export type MessageWithChannel = Message & { channelId: string };

function Content({
	user,
	data,
	setData,
	path,
}: { user: User; data: DiscordBackup; setData: Dispatch<SetStateAction<DiscordBackup | null>>; path: string }) {
	const [filter, setFilter] = useState<Filter>({ query: "", dms: true, guilds: true });
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteProgress, setDeleteProgress] = useState(0);

	// Memoize the filtered data to avoid recomputing unnecessarily
	const filteredData = useMemo(() => filterData(data, filter), [data, filter]);

	const refreshBackup = async () => {
		const data = await invoke<DiscordBackup>("read_discord_backup", {
			directory: path,
		});
		setData(data);
	};

	// Efficient filter function
	function filterData(data: DiscordBackup, filter: Filter) {
		const filterText = filter.query.toLowerCase();
		const shouldFilter = filterText !== "";

		const filterMessages = (messages: Message[], channelId: string) =>
			messages
				.filter((m) => !shouldFilter || m.Contents.toLowerCase().includes(filterText))
				.map((message) => ({ ...message, channelId }));

		return {
			dms: filter.dms ? data.dms.flatMap((dm) => filterMessages(dm.messages, dm.id)) : [],
			guilds: filter.guilds ? data.guilds.flatMap((guild) => filterMessages(guild.messages, guild.id)) : [],
		};
	}

	async function deleteMessageHandler() {
		setIsDeleting(true);
		const messages = [...filteredData.dms, ...filteredData.guilds];
		const batchSize = 2;
		const rateLimitMs = 500;

		for (let i = 0; i < messages.length; i += batchSize) {
			const batch = messages.slice(i, i + batchSize);
			await Promise.all(
				batch.map(async (message) => {
					const status = await invoke<number>("delete_message", {
						token: user.token,
						channelId: message.channelId,
						messageId: message.ID,
					});
					console.log(`Message ${message.ID} deletion request status ${status}`);
					if (status === 404 || status === 204) {
						const span = document.getElementById("delete-message-span") as HTMLSpanElement;
						span.innerText = message.Contents;
					}
				}),
			);

			setDeleteProgress((prev) => prev + batchSize);
			if (i + batchSize < messages.length) {
				await new Promise((r) => setTimeout(r, rateLimitMs));
			}
		}
		refreshBackup();
		setIsDeleting(false);
	}

	return (
		<div className="flex flex-col size-full">
			{isDeleting && (
				<DeletingOverlay progress={deleteProgress} total={filteredData.dms.length + filteredData.guilds.length} />
			)}

			<Card className="size-full border-none">
				<CardHeader>
					<CardTitle>Filter Messages</CardTitle>
					<CardDescription>Enter text to filter messages and select message types</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-2">
						<FilterForm
							filter={filter}
							setFilter={setFilter}
							filteredData={filteredData}
							deleteMessageHandler={deleteMessageHandler}
						/>
						<MessageTabs filteredData={filteredData} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function MessageTabs({ filteredData }: { filteredData: { dms: MessageWithChannel[]; guilds: MessageWithChannel[] } }) {
	return (
		<Tabs defaultValue="dm">
			<TabsList className="grid w-full grid-cols-2">
				<TabsTrigger value="dm">Direct messages</TabsTrigger>
				<TabsTrigger value="guild">Server messages</TabsTrigger>
			</TabsList>
			<TabsContent value="dm">
				{filteredData.dms.length > 5000 ? (
					"There are over 5000 messages that match this query, and they will not be shown due to lag."
				) : (
					<MessageList messages={filteredData.dms} />
				)}
			</TabsContent>
			<TabsContent value="guild">
				{filteredData.guilds.length > 5000 ? (
					"There are over 5000 messages that match this query, and they will not be shown due to lag."
				) : (
					<MessageList messages={filteredData.guilds} />
				)}
			</TabsContent>
		</Tabs>
	);
}

const IMAGE_REGEX = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/i;
function MessageList({ messages }: { messages: MessageWithChannel[] }) {
	return messages.map((message) => {
		const image = message.Contents.match(IMAGE_REGEX)?.[0];
		return (
			<div key={message.ID} className="mb-2 overflow-x-auto bg-neutral-100 p-2 rounded-sm">
				<p className="text-sm">{new Date(message.Timestamp).toLocaleString()}</p>
				<p>{message.Contents}</p>
				{image && (
					<div className="mt-2">
						<img src={image} alt="Embedded content" className="max-w-[200px] h-auto rounded-sm" />
					</div>
				)}
			</div>
		);
	});
}

function DeletingOverlay({ progress, total }: { progress: number; total: number }) {
	return (
		<div className="fixed top-[30px] backdrop-blur-xs justify-center items-center text-white left-0 h-dvh w-screen bg-black/70 flex flex-col">
			<div className="flex flex-col w-full md:w-[500px] px-4 items-center gap-4">
				Deleting messages ({progress}/{total})
				<Progress value={progress} max={total} />
				<span id="delete-message-span" className="font-mono truncate max-h-[200px] max-w-[200px]">
					Loading...
				</span>
			</div>
		</div>
	);
}
