import { Effect } from "effect";
import { ParseError } from "../core/errors.ts";

interface ContentItem {
	type: number;
	text?: string;
	c?: string;
	cdnSrc?: string;
	uid?: string;
}

/** 将 PbContent 原始数据转换为可读文本。 */
export function processContent(data: ContentItem[], needPlainText = true) {
	return Effect.try({
		try: () => {
			if (data === undefined || data === null) return "";

			let resultString = "";
			for (const item of data) {
				switch (item.type) {
					case 0:
					case 9:
					case 18:
					case 27:
					case 40:
						resultString += item.text;
						break;
					case 1:
						resultString += needPlainText ? item.text : `${item.text}#[链接]`;
						break;
					case 2:
					case 11:
						if (item.c === "升起") {
							resultString += "#(生气)";
						} else {
							resultString += `#(${item.c})`;
						}
						break;
					case 3:
					case 20:
						resultString += needPlainText
							? " #[图片] "
							: `\n#[图片](${item.cdnSrc})\n`;
						break;
					case 4:
						resultString += `${item.text}`;
						break;
					case 5:
						resultString += needPlainText ? " #[视频] " : "\n#[视频]\n";
						break;
					case 10:
						resultString += needPlainText ? " #[语音] " : "\n#[语音]\n";
						break;
					default:
						break;
				}
			}
			return resultString;
		},
		catch: (error) => new ParseError(String(error)),
	});
}
