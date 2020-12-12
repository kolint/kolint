import * as fs from 'fs'
import * as glob from 'glob'
import * as path from 'path'
import * as stripJsonComments from 'strip-json-comments'
import * as yaml from 'js-yaml'
import { ConfigOptions } from './cli'

export function getConfigs(argv: unknown, dir: string, patterns = ['.kolint.*'], _i = -1): Map<number, ConfigOptions> {
	const configs = new Map<number, ConfigOptions>()

	if (argv)
		configs.set(++_i, argv as ConfigOptions)

	const files = patterns.map(pattern => glob.sync(pattern, { absolute: true, cwd: dir })).flat()
	for (const file of files) {
		try {
			let config: ConfigOptions

			if (file.endsWith('.json'))
				config = JSON.parse(stripJsonComments(fs.readFileSync(file).toString('utf8'))) as ConfigOptions
			else if (file.endsWith('.yml') || file.endsWith('.yaml'))
				config = yaml.load(fs.readFileSync(file).toString('utf8')) as ConfigOptions
			else if (file.endsWith('.js'))
				// eslint-disable-next-line @typescript-eslint/no-var-requires
				config = require(file) as ConfigOptions
			else
				continue

			if (config)
				configs.set(++_i, config)

			const newDir = path.join(dir, '..')

			if (dir !== newDir && !config.root)
				getConfigs(undefined, newDir, patterns, _i)
		} catch (err) {
			console.log(err)
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
