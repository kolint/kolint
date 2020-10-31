export interface BindingHandler {
	name: string
	valueType: string | {
		customType: string
		additionalTypes: string
	}
	immutableContext?: boolean
}

export interface BindingHandlerContextType {
	contextProperty: string
	additionalTypes?: string
}

interface BindingHandlerAdditionalTypesContextType {
	contextProperty: string
	additionalTypes: string
}

function hasAdditionalTypes(bhct: BindingHandlerContextType | undefined): bhct is BindingHandlerAdditionalTypesContextType {
	return Boolean(bhct?.additionalTypes)
}

export function wrapBindingHandlerContextTypes(bindingHandlers: BindingHandlerContextType[], handlersExtenderName: string): string {
	return `\n${bindingHandlers.filter(hasAdditionalTypes).join('\n')}\n\ninterface Handlers extends ${handlersExtenderName} {\n${bindingHandlers.map(bh => bh.contextProperty).join('\n\t')}\n}`
}

export function getBindingHandlerContextType(bindingHandler: BindingHandler): BindingHandlerContextType {
	if (typeof bindingHandler.valueType === 'string') {
		return {
			contextProperty: `${bindingHandler.name}: BindingHandler<${bindingHandler.valueType}>`
		}
	} else {
		return {
			contextProperty: `${bindingHandler.name}: ${bindingHandler.valueType.customType}`,
			additionalTypes: bindingHandler.valueType.additionalTypes
		}
	}
}
