import type { User } from "@/lib/discord";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ArrowUpRight } from "lucide-react";
import { useEffect } from "react";

export function TitleBar({ user }: { user: User | null }) {
	useEffect(() => {
		const appWindow = getCurrentWindow();

		document.getElementById("titlebar-minimize")?.addEventListener("click", () => appWindow.minimize());
		document.getElementById("titlebar-maximize")?.addEventListener("click", () => appWindow.toggleMaximize());
		document.getElementById("titlebar-close")?.addEventListener("click", () => appWindow.close());
	}, []);

	return (
		<div
			data-tauri-drag-region
			className="fixed h-[30px] px-1 bg-white/80 backdrop-blur-sm hover:bg-neutral-100 group transition-all top-0 w-full flex justify-between items-center"
		>
			<a
				href="https://omarzunic.com/"
				className="p-2 overflow-hidden cursor-pointer underline hover:decoration-neutral-400 decoration-transparent transition-all"
				target="_blank"
				rel="noreferrer"
				title="Creator's website"
			>
				Discappear
				<ArrowUpRight className="inline-flex size-3 ml-.05" />
			</a>
			{user ? (
				<p data-tauri-drag-region className="select-none flex gap-2 py-1 items-center">
					Logged in as
					<img src={user.avatarURL} alt="DM Avatar" className="w-5 h-5 rounded-full select-none" />
					<p className="font-semibold -ml-1">{user.username}</p>
				</p>
			) : (
				<p data-tauri-drag-region className="select-none flex gap-2 py-1 items-center">
					Not signed in
				</p>
			)}
			<div data-tauri-drag-region className="flex flex-row gap-1">
				<button
					type="button"
					className="p-2 group-hover:hover:bg-neutral-200 hover:bg-neutral-100 transition-all rounded-full"
					id="titlebar-minimize"
				>
					<img src="https://api.iconify.design/mdi:window-minimize.svg" alt="minimize" />
				</button>
				<button
					type="button"
					className="p-2 group-hover:hover:bg-neutral-200 hover:bg-neutral-100 transition-all rounded-full"
					id="titlebar-maximize"
				>
					<img src="https://api.iconify.design/mdi:window-maximize.svg" alt="maximize" />
				</button>
				<button
					type="button"
					className="p-2 group-hover:hover:bg-neutral-200 hover:bg-neutral-100 transition-all rounded-full"
					id="titlebar-close"
				>
					<img src="https://api.iconify.design/mdi:close.svg" alt="close" />
				</button>
			</div>
		</div>
	);
}
