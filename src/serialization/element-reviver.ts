import { Element } from '../interfaces';
import { ElementMapImpl } from '../element-map';
import { ModelDelegateImpl } from '../model-delegate';
import { ElementJsonTransformer } from './element-json-transformer';
import { ElementReferenceResolver } from './element-reference-resolver';
import { ElementComparerImpl } from '../element-comparer';

class Stack<T> {
    private data: T[] = [];
    private top: number = 0;

    public push(element: T) {
        this.data[this.top] = element;
        this.top = this.top + 1;
    }

    public get length() {
        return this.top;
    }
    public get isEmpty() {
        return this.top === 0;
    }
    public peek(): T | undefined {
        if (this.top === 0) return;
        return this.data[this.top - 1];
    }
    public pop(): T | undefined {
        if (this.top === 0) return;
        this.top -= 1;
        return this.data.pop(); // removes the last element
    }
}

interface MappedStackEntry {
    /**
     * The raw JSON source element from which 'target' is created.
     */
    source: any;
    /**
     * Contains the element that is being deserialized. This element must be returned by the reviver function
     * when the reviver's 'value' argument matches the 'source' pproperty of this entry. 
     */
    target: Element;
}

export class ElementReviver {
    private modelDelegate: ModelDelegateImpl;
    private targetStack: Stack<MappedStackEntry> = new Stack<MappedStackEntry>();
    private jsonTransformer: ElementJsonTransformer;

    /**
     * Constructor. Creates a new ElementReviver instance.
     * @param applySorting True to sort packaged- and ordered (having an Order property) elements.
     */
    constructor(applySorting: boolean) {
        const elementMap = new ElementMapImpl(true /* initializeWithPrimitives: true */);
        const modelDelegate = new ModelDelegateImpl(elementMap)
        const referenceResolver = new ElementReferenceResolver(modelDelegate);

        this.jsonTransformer = new ElementJsonTransformer(
            referenceResolver,
            applySorting ? ElementComparerImpl.getInstance() : null
        );
        this.modelDelegate = modelDelegate;
    }

    public revive(obj: any, key: string, value: any): any {
        const targetEntry = this.targetStack.peek();
        // let consoleIndent = ' ';
        // for (let i = 0; i < this.targetStack.length; i++) consoleIndent += ' ';

        if (targetEntry && value === targetEntry.source) {
            // Value is the element that we are currently targeting, either as property or as array member:
            // 1. If key.length is 0, the element that we return should be the root (Model) element (the bottom of the stack).
            // 2. If key is a - stringified - number and Array.isArray(obj), the element that we return becomes the new array member.
            // 3. Otherwise, the element that we return is a child property (e.g. Property.DefaultValue).
            const el = this.targetStack.pop()!.target;

            // 1.
            if (!key.length) {
                // We are done. Let's resolve all internal references between elements.
                this.jsonTransformer.resolveReferences();
                return el;
            }

            // console.log(`${consoleIndent}Property ${key} is the current object. Popped '${(el as NamedElement).name}'.`);
            // 2.
            if (Array.isArray(obj)) {
                return el;
            }
            // 3. 
            const parent = this.targetStack.peek();
            if (parent) {
                (parent.target as any)[key] = el;
            }
            return undefined;
        }

        if (Array.isArray(obj)) {
            // Value is NOT the element that we are currently targeting and the object is an array. This means that is is a type that we did not
            // convert (for example, value is an array of element IDs). Keep this array as is.
            return value;
        }

        const elementType: string | null = obj['elementType'] || null;
        const elementId: string | null = obj['id'] || null; // the id is not required for all element types, but it is important when it is.
        let targetElement: Element;
        if (!targetEntry) {
            // We are encountering the first property in the first object (which should be the Model).
            if (!elementType) throw 'Unable to create root element. The data is missing the "elementType" property.';
            //  console.log(`Creating root element of type '${elementType}'.`);            
            targetElement = this.modelDelegate.createElement(elementType as any, null, { id: elementId }, null);
            this.targetStack.push({ source: obj, target: targetElement });
            // consoleIndent += ' ';
        }
        else if (targetEntry.source !== obj) {
            // A new object is created. Push a new object onto the stack
            if (!elementType) throw 'Unable to create child element. The data is missing the "elementType" property.';
            // console.log(`${consoleIndent}Creating new child element of type '${elementType}'. Owner type: ${elements.ElementType[targetEntry.target.elementType]}.`);
            targetElement = this.modelDelegate.createElement(elementType as any, targetEntry.target, { id: elementId }, null);

            this.targetStack.push({ source: obj, target: targetElement });
            // consoleIndent += ' ';
        }
        else
            targetElement = targetEntry.target;

        if (key === 'elementType' || key === 'id') {
            // Don't overwrite elementType: it has already been taken care of by the ElementFactory, and this saves some mapping logic in the ElementJsonTransformer.            
            // Don't overwrite id. We already mapped it.
            return undefined;
        }

        const mappedValue = this.jsonTransformer.revive(targetElement, key, value);

        // Set the value, but only if mapped. If mappedValue is undefined, our default - as created by the ElementFactory - would be deleted.
        if (mappedValue) {
            //  const currentElementType: string = elements.ElementType[targetElement.elementType];
            //  console.log(`${consoleIndent}${currentElementType || obj.constructor.name}.${key} => ${mappedValue}`);
            (targetElement as any)[key] = mappedValue;
        }
        return undefined; // no need to keep the value as long as we update the target element
    }
}