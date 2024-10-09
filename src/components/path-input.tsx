import type { DiscordBackup } from "@/lib/discord";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invoke } from "@tauri-apps/api/core";
import { ArrowRight, Loader } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";

export function PathInput({
	setData,
	setPath,
}: { setData: Dispatch<SetStateAction<DiscordBackup | null>>; setPath: Dispatch<SetStateAction<string>> }) {
	const [loading, setLoading] = useState(false);

	const readBackup = async (path: string) => {
		setLoading(true);
		try {
			const backupData = await invoke<DiscordBackup>("read_discord_backup", {
				directory: path,
			});
			setData(backupData);
		} catch (error) {
			console.error("Failed to read backup:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col p-4">
			<CardContent className="gap-4 select-none flex flex-col">
				<div className="flex flex-col items-center gap-2 justify-center">
					<p className="text-2xl  w-full font-semibold text-center">Your export</p>
					<span className="text-center text-pretty">
						After you've extracted your export, you should see a messages folder. Paste the path to it here.
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<Label htmlFor="path">Messages folder</Label>
					<div className="flex gap-2">
						<Input id="path" placeholder="Paste it here" />
						<Button
							disabled={loading}
							onClick={async () => {
								setLoading(true);
								const input = document.getElementById("path");
								if (!input) return;

								const path = (input as HTMLInputElement).value;
								setPath(path);
								await readBackup(path);
							}}
						>
							{loading ? <Loader className="animate-spin" /> : "Load data"}
						</Button>
					</div>
				</div>
				<div className="flex flex-col items-center gap-2 mt-8 justify-center">
					<p className="text-lg  w-full font-semibold text-center">Where do I find my export?</p>
					<div className="flex items-center justify-center w-full max-w-3xl">
						<a
							href="discord://-/settings/privacy-and-safety"
							className="underline text-sm decoration-neutral-400 transition-all"
						>
							Privacy & Safety (click to open)
						</a>
						<ArrowRight className="mx-2 text-muted-foreground" />
						<span className="text-sm text-center">Request all of my data (include messages)</span>
					</div>
				</div>
			</CardContent>
		</div>
	);
}
