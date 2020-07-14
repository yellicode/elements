import { Type } from './interfaces';
import { primitiveBooleanType, primitiveIntegerType, primitiveRealType, primitiveStringType, primitiveObjectType } from './primitives';

/**
 * Represents a type resolver, which can return a built-in type
 * based on a uniqure type id.
 */
export interface TypeResolver {
    resolve(id: string): Type | undefined;
}

/**
 * Resolves built-in primitive types. An additional custom resolver
 * can be provided to resolve custom applciation types that are not
 * part of a profile.
 */
export class BasicTypeResolver implements TypeResolver {
    constructor(private customResolver?: TypeResolver) {

    }

    public resolve(id: string): Type | undefined {
        switch (id)    {
            case 'boolean_id':
                return primitiveBooleanType;
            case 'integer_id':
                return primitiveIntegerType;
            case 'real_id':
                return primitiveRealType;
            case 'string_id':
                return primitiveStringType;
            case 'object_id':
                return primitiveObjectType;
        }
        if (this.customResolver)
            return this.customResolver.resolve(id);
    }
}