import * as path from 'path'
import { workspace, ExtensionContext } from 'vscode'

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient'

let client: LanguageClient

export function activate(context: ExtensionContext) {
	let serverModule = context.asAbsolutePath(path.join('out', 'server', 'server.js'))

	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] }

	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	}

	let clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'html' }],
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher('**/.korc')
		}
	}

	const languageServerName = 'Knockout Language Server'

	client = new LanguageClient(
		languageServerName.replace(/\ /g, ''),
		languageServerName,
		serverOptions,
		clientOptions
	)

	client.start()
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined
	}
	return client.stop()
}