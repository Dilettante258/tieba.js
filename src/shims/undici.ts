type RequestOptions = {
	method?: string;
	headers?: HeadersInit;
	body?: BodyInit | null;
	dispatcher?: unknown;
};

type ResponseBody = {
	json: () => Promise<unknown>;
	arrayBuffer: () => Promise<ArrayBuffer>;
	text: () => Promise<string>;
	dump: () => Promise<void>;
};

type RequestResult = {
	statusCode: number;
	statusText: string;
	body: ResponseBody;
};

export type Dispatcher = unknown;

/**
 * Worker side compatibility class: keep constructor signature,
 * but do not implement connection pool behavior at runtime.
 */
export class Agent {
	constructor(_options?: unknown) {}
}

export const FormData = globalThis.FormData;

/**
 * Compatibility layer for undici.request implemented via fetch.
 */
export async function request(
	url: string | URL,
	options: RequestOptions = {},
): Promise<RequestResult> {
	const response = await fetch(url, {
		method: options.method,
		headers: options.headers,
		body: options.body ?? undefined,
	});

	const body: ResponseBody = {
		json: () => response.clone().json(),
		arrayBuffer: () => response.clone().arrayBuffer(),
		text: () => response.clone().text(),
		dump: async () => {
			await response.arrayBuffer();
		},
	};

	return {
		statusCode: response.status,
		statusText: response.statusText,
		body,
	};
}
