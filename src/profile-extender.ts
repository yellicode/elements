/*
 * Copyright (c) 2020 Yellicode
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { StringUtility } from '@yellicode/core';
import { ElementTypeUtility } from './utils';

import * as Interfaces from "./interfaces";
import * as Classes from "./classes";
import { ProfileUtility } from './profile-utility';

export class ProfileExtender {
    public static applyProfiles(profiles: Interfaces.Profile[]): void {
        return; // disabled in favor of modeler-generated profile API code

        // profiles.forEach(p => {
        //     ProfileExtender.applyProfile(p as Interfaces.Profile);
        // })        
    }

    private static applyProfile(profile: Interfaces.Profile): void {
        return; // disabled in favor of modeler-generated profile API code

        // const stereotypes = ProfileUtility.getStereotypes(profile);
        // if (stereotypes.length === 0) 
        //     return;

        // ProfileExtender.addHasProfileGetters(profile);
        // ProfileExtender.addHasStereotypeGetters(stereotypes);
    }

    /**
     * Extends all Package class types with getters for checking if the profile is applied to the Package.
     */
    private static addHasProfileGetters(profile: Interfaces.Profile): void {
        const classTypes = ProfileExtender.getClassTypesByElementType(Interfaces.ElementType.package);
        ProfileExtender.extendTypesWithGetter(classTypes, `hasProfile_${profile.safeName || profile.name}`, function (this: Interfaces.Package) {
            return ProfileUtility.hasProfileId(this, profile.id);
        });
    }

    /**
     * Extends all extendable class types with getters for checking if a stereotype is applied.
     */
    private static addHasStereotypeGetters(stereoTypes: Interfaces.Stereotype[]): void {
        stereoTypes.forEach(st => {
            const metaClasses = ProfileUtility.getMetaClassesExtendedBy(st);
            metaClasses.forEach(metaClass => {
                const classTypes = ProfileExtender.getClassTypesByElementType(metaClass);
                ProfileExtender.extendTypesWithGetter(classTypes, `is_${st.safeName || st.name}`, function (this: Interfaces.Element) {
                    // console.log(`Checking stereotype ${st.name}`);                   
                    return ProfileUtility.hasStereotypeId(this, st.id);
                });
                ProfileExtender.extendTypesWithGetter(classTypes, `as_${st.safeName || st.name}`, function (this: Interfaces.Element) {
                    // console.log(`Checking stereotype ${st.name}`);                   
                    return this; // just return the current instance, this getter is just syntactic sugar for the TS compiler
                });
            });
        });
    }

    private static addSubElementAccessors(stereoTypes: Interfaces.Stereotype[], elementType: Interfaces.ElementType, elementSubTypes: Interfaces.ElementType[]): void {
        const classTypes = ProfileExtender.getClassTypesByElementType(elementType);
        ProfileExtender.addSubSelementAccessorsForElementTypes(classTypes, stereoTypes, elementSubTypes);
    }

    /**        
     * Adds accessor functions for stereotypes to the package (and model) level, e.g. getMyStereotypeClasses(), 
     * getMyStereotypeInterfaces(), etc     
     */
    private static addPackageStereotypeAccessors(profile: Interfaces.Profile, stereoTypes: Interfaces.Stereotype[]): void {

        // We apply the accessors to package types
        const packageTypes = ProfileExtender.getClassTypesByElementType(Interfaces.ElementType.package);

        stereoTypes.forEach(st => {
            // Does the stereotype extend a packageable element? If not, don't add an accessor on the package level.            
            const subPackagedElementTypes = st.extends.filter((ext) => ElementTypeUtility.isPackageableElement(ext.metaClass)).map(ext => ext.metaClass);
            if (subPackagedElementTypes.length === 0)
                return;

            // Add an accessor for each packageable element that the profile extends
            ProfileExtender.addSubSelementAccessorsForElementTypes(packageTypes, stereoTypes, subPackagedElementTypes);

            // Create a generic accessor for all packaged elements having the stereotype applied            
            ProfileExtender.extendTypesWithFunction(packageTypes, `getPackagedElementsOf${st.safeName || st.name}`, function (this: Interfaces.Package) {
                return ProfileUtility.filterByStereotypeId(this.packagedElements, st.id);
            });
        })

        // Create a accessor for access to packages having this profile applied (e.g. getPackagesOfMyProfile)        
        ProfileExtender.extendTypesWithFunction(packageTypes, `getPackagesOf${profile.safeName || profile.name}`, function (this: Interfaces.Package) {
            return ProfileUtility.filterByProfileId(this.packagedElements, profile.id);
        });
    }


    /**
     * Extends all classifier types with accessors to profile-specific stereotypes for Operations, Properties etc.        
     */
    private static addClassifierAccessors(stereoTypes: Interfaces.Stereotype[]): void {
        //  All these types are a MemberedClassifier, so can have Properties (OwnedAttributes) and OwnedOperations    
        const classifierSubTypes = [Interfaces.ElementType.property, Interfaces.ElementType.operation];
        stereoTypes.forEach(st => {
            const memberedClassifiersExtendedByStereotype = st.extends.filter((ext) => ElementTypeUtility.isMemberedClassifier(ext.metaClass));
            memberedClassifiersExtendedByStereotype.forEach((extension) => {
                //  console.info(`Stereotype ${st.name} extends classifier ${StringUtil.capitalize(Interfaces.ElementType[extendedElementType])}`);
                const classTypes = ProfileExtender.getClassTypesByElementType(extension.metaClass);
                ProfileExtender.addSubSelementAccessorsForElementTypes(classTypes, stereoTypes, classifierSubTypes);
            });
        });
    }

    private static addSubSelementAccessorsForElementTypes(classTypes: any[], stereoTypes: Interfaces.Stereotype[], elementTypes: Interfaces.ElementType[]): void {
        const classTypesDebugString = classTypes.map(t => t.name).join(', ');
        elementTypes.forEach(subElementType => {
            const stereoTypesExtendingSubType = stereoTypes.filter(s => s.extends.findIndex(t => t.metaClass === subElementType) > -1);
            if (stereoTypesExtendingSubType.length > 0) {
                // console.info(`ProfileExtender: Adding ${StringUtil.capitalize(Interfaces.ElementType[subElementType])} stereotype accessors to ${classTypesDebugString}.`);
            }
            else {
                // There are no Stereotypes that extend the subType, so there is no need to add an accessor
                // console.info(`ProfileExtender: Not adding ${StringUtil.capitalize(Interfaces.ElementType[subElementType])} stereotype accessors to ${classTypesDebugString}. There is no stereotype extending this element type.`);
                return;
            }
            // If this an "Owned" sub element (e.g. OwnedOperations, OwnedAttributes), add a prefix.
            const prefix = ElementTypeUtility.isPackageableElement(subElementType) ? '' : 'Owned';
            stereoTypesExtendingSubType.forEach(st => {
                const pluralElementTypeName = ProfileExtender.getGetPluralElementTypeName(subElementType);
                const functionName = `get${prefix}${pluralElementTypeName}Of${st.safeName || st.name}`; // E.g "getClassesOfMyStereotype"                        
                const accessorFunction = ProfileExtender.getAccessorFunctionForSubElementType(subElementType, st);
                if (accessorFunction) {
                    ProfileExtender.extendTypesWithFunction(classTypes, functionName, accessorFunction);
                }
                else {
                    // console.warn(`Failed adding accessor function '${functionName}' to ${classTypesDebugString}. Sub element type ${Interfaces.ElementType[subElementType]} is not supported.`);                
                }
            })
        });
    }

    private static getAccessorFunctionForSubElementType(subElementType: Interfaces.ElementType, stereoType: Interfaces.Stereotype): ((this: any) => any) | null {
        if (ElementTypeUtility.isPackageableElement(subElementType)) {
            // E.g. getMyStereotypeClasses
            return function (this: Interfaces.Package) {
                return ProfileUtility.filterByStereotypeId(this.packagedElements, stereoType.id, subElementType);
            }
        }
        switch (subElementType) {
            case Interfaces.ElementType.property:
                return function (this: Interfaces.MemberedClassifier) {
                    return ProfileUtility.filterByStereotypeId(this.ownedAttributes, stereoType.id);
                }
            case Interfaces.ElementType.operation:
                return function (this: Interfaces.MemberedClassifier) {
                    return ProfileUtility.filterByStereotypeId(this.ownedOperations, stereoType.id);
                }
            case Interfaces.ElementType.parameter:
                return function (this: Interfaces.Operation) {
                    return ProfileUtility.filterByStereotypeId(this.ownedParameters, stereoType.id);
                }
            case Interfaces.ElementType.enumerationLiteral:
                return function (this: Interfaces.Enumeration) {
                    return ProfileUtility.filterByStereotypeId(this.ownedLiterals, stereoType.id);
                }
            default:
                return null;
        }
    }

    private static extendTypesWithFunction(classTypes: any[], funcName: string, func: Function): void {
        classTypes.forEach(t => {
            // console.info(`ProfileExtender: Extending type ${t.name} with function '${funcName}'.`);           
            t.prototype[funcName] = func;
        })
    }

    private static extendTypesWithGetter<TReturn>(classTypes: any[], propertyName: string, getter: () => TReturn): void {
        classTypes.forEach(t => {
            // console.info(`ProfileExtender: Extending type ${t.name} with getter '${propertyName}'.`);
            Object.defineProperty(t.prototype, propertyName, {
                get: getter,
                enumerable: true,
                configurable: true,
            });
        });
    }

    /**
     * Gets the actual Javascript implementation types that match the specified element type.
     */
    private static getClassTypesByElementType(elementType: Interfaces.ElementType): any[] {
        switch (elementType) {
            case Interfaces.ElementType.package:
                return [Classes.Model, Classes.Package];
            case Interfaces.ElementType.class:
                return [Classes.Class];
            case Interfaces.ElementType.dataType:
                return [Classes.DataType, Classes.PrimitiveType];
            case Interfaces.ElementType.interface:
                return [Classes.Interface];
            case Interfaces.ElementType.enumeration:
                return [Classes.Enumeration];
            case Interfaces.ElementType.enumerationLiteral:
                return [Classes.EnumerationLiteral];
            case Interfaces.ElementType.property:
                return [Classes.Property];
            case Interfaces.ElementType.operation:
                return [Classes.Operation];
            case Interfaces.ElementType.parameter:
                return [Classes.Parameter];
            default:
                console.warn(`Failed getting class type(s) for element type '${Interfaces.ElementType[elementType]}'. The element type is not supported.`);
                return [];
        }
    }

    private static getGetPluralElementTypeName(elementType: Interfaces.ElementType): string {
        switch (elementType) {
            case Interfaces.ElementType.property:
                return 'Attributes';
            case Interfaces.ElementType.class:
                return 'Classes';
            case Interfaces.ElementType.enumerationLiteral:
                return 'Literals';
            default:
                // By default, add ..s
                var singular = StringUtility.capitalize(Interfaces.ElementType[elementType]);
                return `${singular}s`;
        }
    }
}