import * as e from './interfaces';

/**
 * Implements a simple data type that has no behavior.
 */
export class SimpleDataType implements e.DataType {
    constructor(public id: string, public name: string, public elementType: e.ElementType.dataType | e.ElementType.primitiveType) {

    }

    public get package(): e.Package {
        throw `The ${this.name} data type has no package.`;
    }
    public visibility: e.VisibilityKind | null = null;
    public ownedAttributes: e.Property[] = [];
    public ownedOperations: e.Operation[] = [];
    public generalizations: e.Generalization[] = [];
    public isAbstract: boolean = false;
    public isFinalSpecialization: boolean = false;
    public appliedStereotypes: e.Stereotype[] = [];
    public ownedComments: e.Comment[] = [];
    public owner: e.Element | null = null;
    public taggedValues: e.TaggedValueSpecification[] = [];
    public isLeaf: boolean = false;
    public isInferred: boolean = false;

    public getFirstCommentBody(): string {
        return '';
    }

    public getAllParents(): e.Classifier[] {
        throw new Error('Method not implemented.');
    }
    public getAllSpecializations(): e.Classifier[] {
        throw new Error('Method not implemented.');
    }
    public getFirstGeneralization(): e.Generalization | null {
        return null;
    }
    public getFirstParent(): e.Classifier | null {
        return null;
    }
    public getParents(): e.Classifier[] {
        return [];
    }
    public getSpecializations(): e.Classifier[] {
        return [];
    }
    public getNamespaceName(separator?: string | undefined): string {
        return '';
    }
    public getNestingPackages(): e.Package[] {
        return [];
    }
    public getQualifiedName(separator?: string | undefined): string {
        return this.name;
    }
    public getAllAttributes(): e.Property[] {
        return [];
    }
    public getAllOperations(): e.Operation[] {
        return [];
    }
}