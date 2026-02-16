import { Effect, pipe } from "effect";
import type { TiebaClient } from "../client.ts";
import { TiebaServerError } from "./errors.ts";

interface MessageEncoder<T> {
	fromPartial(data: unknown): T;
	encode(message: T): { finish(): Uint8Array };
}

interface MessageDecoder<T> {
	decode(input: Uint8Array): T;
}

interface ProtoResponse {
	error?: { errorno?: number; errmsg?: string };
}

/**
 * Protobuf API 工厂函数。
 * 消除重复的 packProto → postProtobuf → parseBody 模式。
 */
export function createProtoApi<
	Req,
	Res extends ProtoResponse,
	Params,
	Result,
>(config: {
	endpoint: string;
	reqCodec: MessageEncoder<Req>;
	resCodec: MessageDecoder<Res>;
	buildRequest: (client: TiebaClient, params: Params) => unknown;
	extractResult: (res: Res) => Result;
}) {
	return (client: TiebaClient, params: Params) =>
		pipe(
			Effect.succeed(
				config.reqCodec
					.encode(
						config.reqCodec.fromPartial(config.buildRequest(client, params)),
					)
					.finish(),
			),
			Effect.andThen((buf) => client.postProtobuf(config.endpoint, buf)),
			Effect.map((buf) => {
				const res = config.resCodec.decode(buf);
				if (res.error?.errorno) {
					throw new TiebaServerError(res.error.errorno, res.error.errmsg ?? "");
				}
				return config.extractResult(res);
			}),
		);
}
