import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type User, getCurrentUser } from "@/lib/discord";
import { Loader } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";

export function Auth({ setUser }: { setUser: Dispatch<SetStateAction<User | null>> }) {
	const [valid, setValid] = useState(true);
	const [loading, setLoading] = useState(false);
	return (
		<div className="flex flex-col p-4">
			<CardContent className="gap-4 select-none flex flex-col">
				<div className="flex flex-col items-center gap-2 justify-center">
					<p className="text-2xl  w-full font-semibold text-center">Login</p>
					<span className="text-center text-pretty">
						Your token is only ever stored in-memory, and is only sent to Discord to delete your messages. If you're
						paranoid, build this binary yourself.
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<Label htmlFor="token">Discord token</Label>
					<div className="flex gap-2">
						<Input id="token" placeholder="Paste it here" />
						<Button
							onClick={async () => {
								setLoading(true);
								const input = document.getElementById("token");
								if (!input) return;

								const data = await getCurrentUser((input as HTMLInputElement).value);
								setLoading(false);
								if (!data) {
									setValid(false);
									return;
								}

								setUser(data);
							}}
						>
							{loading ? <Loader className="animate-spin" /> : "Log in"}
						</Button>
					</div>
					<span className="text-red-500">{!valid && "Invalid token"}</span>
				</div>
				<div className="flex flex-col items-center gap-2 mt-8 justify-center">
					<p className="text-lg  w-full font-semibold text-center">How do I get my token?</p>
					<span className="text-center text-pretty">
						You can follow{" "}
						<a
							className="underline decoration-neutral-400 transition-all"
							href="https://www.androidauthority.com/get-discord-token-3149920/"
							target="_blank"
							rel="noreferrer"
						>
							this guide
						</a>
						.
					</span>
				</div>
			</CardContent>
		</div>
	);
}
