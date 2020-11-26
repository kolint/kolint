/* eslint-disable */
import { RootBindingContext, StandardBindingContextTransforms, Overlay, BindingContextTransform } from '$typelib_placeholder'
//import ViewModel from './viewmodel'
'$viewmodel_placeholder'

function getBindingContextFactory<K extends keyof BindingContextTransforms>(bindingHandlerName: K) {
	void bindingHandlerName
	const factory: BindingContextTransforms[K] = 0 as any;
	return factory;
}

//import bindinghandler_koko from './bindinghandler';
'$bindinghandlers_placeholder'

'$transforms_placeholder'

type BindingContextTransforms = Overlay<CustomBindingTransforms, StandardBindingContextTransforms>

// const context_binding_0: RootBindingContext<ViewModel> = undefined as any
// const context_0 = binding_3(root_context)
// const context_1 = binding_4(context_0)
// const context_2 = binding_1(root_context)
// const context_3 = binding_2(context_2)
'$generated_contexts'

//function binding_1($context: typeof root_context) {...}
'$generated_bindings'