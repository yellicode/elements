/*
 * Copyright (c) 2018 Yellicode
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as Interfaces from "./interfaces";
import * as Classes from "./classes";

export class ProfileUtility {
    public static getStereotypes(profile: Interfaces.Profile): Interfaces.Stereotype[] {
        if (!profile.packagedElements) return [];
        return profile.packagedElements.filter((e) => e.elementType === Interfaces.ElementType.stereotype) as Interfaces.Stereotype[];
    }

    public static hasStereotypeId<TElement extends Interfaces.Element>(element: TElement | null, stereotypeId: string): boolean {
        if (!element || !element.appliedStereotypes)
            return false;

        return ProfileUtility.hasStereotypeIdRecursive(element.appliedStereotypes, stereotypeId);
    }

    private static hasStereotypeIdRecursive<TElement extends Interfaces.Element>(stereotypes: Interfaces.Classifier[], stereotypeId: string): boolean {
        for (var index = 0; index < stereotypes.length; index++) {
            var stereotype = stereotypes[index];
            if (stereotype.id === stereotypeId)
                return true;

            // If the stereotype has parents, check these too                        
            const stereotypeGenerals = stereotype.getParents();
            if (stereotypeGenerals.length > 0 && ProfileUtility.hasStereotypeIdRecursive(stereotypeGenerals, stereotypeId)) {
                return true;
            }
        }
        return false;
    }

    public static getMetaClassesExtendedBy(stereotype: Interfaces.Stereotype): Interfaces.ElementType[] {
        // First add the stereotype's own meta classes
        return stereotype.extends.map(ext => ext.metaClass);
    }

    public static getAllMetaClassesExtendedBy(stereotype: Interfaces.Stereotype): Interfaces.ElementType[] {
        // First add the stereotype's own meta classes
        const metaClasses = ProfileUtility.getMetaClassesExtendedBy(stereotype);
        // Then add meta classes of the specializing stereotypes
        stereotype.getSpecializations().forEach((derivedStereotype) => {
            (derivedStereotype as Interfaces.Stereotype).extends.forEach(extension => {
                if (metaClasses.indexOf(extension.metaClass) === -1) {
                    metaClasses.push(extension.metaClass);
                }
            })
        });
        return metaClasses;
    }

    public static hasProfileId<TElement extends Interfaces.Package>(pack: Interfaces.Package | null, profileId: string): boolean {
        if (!pack || !pack.appliedProfiles) return false;
        return pack.appliedProfiles.some((s) => s.id === profileId);
    }

    /**
     * Filters the array of elements by only including the elements that have a particular stereotype applied.     
     */
    public static filterByStereotypeId<TElement extends Interfaces.Element>(elements: TElement[], stereotypeId: string, elementType?: Interfaces.ElementType): TElement[] {
        if (!elements) return [];
        if (elementType) {
            return elements.filter(e => {
                return e.elementType === elementType && ProfileUtility.hasStereotypeId(e, stereotypeId)
            });
        }
        return elements.filter(e => { return ProfileUtility.hasStereotypeId(e, stereotypeId) });
    }

    /**
     * Filters the array of packageable element by only including the packages that have a particular profile applied.     
     */
    public static filterByProfileId(elements: Interfaces.PackageableElement[], profileId: string): Interfaces.Package[] {
        if (!elements) return [];
        return elements.filter((e) => e.elementType === Interfaces.ElementType.package &&
            ProfileUtility.hasProfileId(e as Interfaces.Package, profileId)) as Interfaces.Package[];
    }
}