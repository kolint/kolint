import * as fs from 'fs'
import glob from 'tiny-glob'
import * as path from 'path'
import stripJsonComments from 'strip-json-comments'
import * as yaml from 'js-yaml'
import { ConfigOptions } from '.'
import utils from '../utils'

async function getConfigPath(dir: string, patterns: string[]): Promise<string | undefined> {
	const files = utils.flat(await Promise.all(patterns.map(async pattern => {
		try {
			return await glob(pattern, { absolute: true, cwd: dir, dot: true, filesOnly: true })
		} catch {
			return []
		}
	})))

	if (files.length > 0) {
		// TODO: handle multiple config files
		return files[0]
	} else {
		const newDir = path.resolve(dir, '..')

		if (dir === newDir) {
			// Root
			return
		}

		return getConfigPath(newDir, patterns)
	}
}

const configCache = new Map<string, ConfigOptions>()
function readConfig(configFilePath: string) {
	if (configCache.has(configFilePath)) {
		return configCache.get(configFilePath)
	}

	let config: ConfigOptions | undefined

	const json = () => JSON.parse(stripJsonComments(fs.readFileSync(configFilePath).toString('utf8'))) as ConfigOptions
	const yml = () => yaml.load(fs.readFileSync(configFilePath).toString('utf8')) as ConfigOptions
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const js = () => require(configFilePath) as ConfigOptions

	if (configFilePath.endsWith('.js'))
		config = js()
	else if (configFilePath.endsWith('.json'))
		config = json()
	else if (configFilePath.endsWith('.yml') || configFilePath.endsWith('.yaml'))
		config = yml()

	try {
		config = js()
	} catch {
		try {
			config = json()
		} catch {
			try {
				config = yml()
			} catch { }
		}
	}

	if (config) {
		configCache.set(configFilePath, config)
	}

	return config
}

export async function getConfigs(args: Record<string, unknown> | undefined, dir: string, patterns: string[], _i = -1): Promise<Map<number, ConfigOptions>> {
	const configs = new Map<number, ConfigOptions>()

	// Clone args and delete non-option values
	if (args) {
		args = { ...args }
		delete args._
		delete args.$0
	}

	if (args)
		configs.set(++_i, args)

	const configFilePath = await getConfigPath(dir, patterns)

	if (configFilePath) {
		const config = readConfig(configFilePath)

		if (config) {
			configs.set(++_i, config)

			if (config.root === true) {
				return configs
			}
		}
	}

	const newDir = path.join(dir, '..')

	if (dir !== newDir) {
		const map = await getConfigs(undefined, newDir, patterns, _i)

		for (const [key, value] of map.entries()) {
			configs.set(key, value)
		}
	}

	return configs
}

export function joinConfigs(configs: Map<number, ConfigOptions>): ConfigOptions {
	let config = {} as ConfigOptions

	for (const _config of Array.from(configs.entries()).map(config => config[1]))
		config = Object.assign(config, _config)

	return config
}
