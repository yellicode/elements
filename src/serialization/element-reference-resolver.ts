import { Element, NamedElement, Generalization, Association, Property } from '../interfaces';
import { ModelDelegate } from '../model-delegate-interface';

/**
 * Contains all unresolved references for a particular key.
 */
interface UnResolvedReferences {
    /**
     * Contains, for each element that is referred to (e.g. the id 'integer_id' or a 
     * generated id for a model type), a list of elements that refer to it (e.g. any TypedElement that has type 'integer_id').
     */
    referrersByElementId: { [referredElementId: string]: Element[] };
    /**
     * Indicates if the property to which these reference apply (the current key) is an array.
     */
    isArrayProperty: boolean;
}

export class ElementReferenceResolver {
    /**
     * Contains a list of unresolved references, grouped by key (that is, the name of the 
     * referring property).
     */
    private unResolvedReferencesByKey: { [key: string]: UnResolvedReferences } = {};

    constructor(private modelDelegate: ModelDelegate) {

    }

    public resolve() {
        Object.keys(this.unResolvedReferencesByKey).forEach((key) => {
            const group = this.unResolvedReferencesByKey[key];
            Object.keys(group.referrersByElementId).forEach(elementId => {
                const referredElement = this.modelDelegate.findElementById(elementId);
                const referrers = group.referrersByElementId[elementId];
                if (!referredElement) return console.warn(`${referrers.length} elements have a '${key}' reference with unresolvable id ${elementId}.`);
                referrers.forEach(referrer => {
                    // console.log(`${(referrer as NamedElement).name || referrer.id} has ${key} ${elementId}. Array: ${group.isArrayProperty}`);
                    if (group.isArrayProperty) {
                        let array = (referrer as any)[key];
                        if (!array) { // ensure an array (although it should already be initialized)
                            (referrer as any)[key] = array = [];
                        }
                        array.push(referredElement);
                    }
                    else
                        (referrer as any)[key] = referredElement;

                    // Apply custom logic to some relationships
                    switch (key) {
                        case 'general':
                            // Even though there is a onGeneralizationAdded call in modelDelegate.createElement(), 
                            // that call doesn't have any effect without a general.
                            this.modelDelegate.onGeneralizationAdded(referrer as Generalization);
                            break;
                        case 'memberEnds':
                            this.modelDelegate.onMemberEndAdded(referrer as Association, referredElement as Property);
                            break;
                    }
                });
            });
        });
        this.unResolvedReferencesByKey = {};
    }

    public addUnResolvedReference(key: string, referrer: Element, elementId: string | string[]): void {
        let isArray: boolean = false;
        let collection: string[];
        if (Array.isArray(elementId)) {
            collection = elementId;
            isArray = true;
        }
        else collection = [elementId];
        let referencesForKey = this.unResolvedReferencesByKey[key];
        if (!referencesForKey) {
            this.unResolvedReferencesByKey[key] = referencesForKey = { isArrayProperty: isArray, referrersByElementId: {} };
        }
        collection.forEach(elementId => {
            let referrers: Element[] = referencesForKey.referrersByElementId[elementId];
            if (!referrers) referencesForKey.referrersByElementId[elementId] = referrers = [];
            referrers.push(referrer);
        })
    }

}