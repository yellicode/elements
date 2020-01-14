/*
* Copyright (c) 2020 Yellicode
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/**
* This code was generated by a tool.
* 
* Changes to this file may cause incorrect behavior and will be lost if the code is regenerated.
*/
export type ElementType = "taggedValueSpecification"|"stereotypeExtension"|"class"|"stereotype"|"property"|"package"|"profile"|"dataType"|"primitiveType"|"parameter"|"operation"|"model"|"literalUnlimitedNatural"|"literalString"|"literalReal"|"literalNull"|"literalInteger"|"literalBoolean"|"interfaceRealization"|"interface"|"generalization"|"enumerationLiteral"|"enumeration"|"documentReference"|"document"|"comment"|"association";

/**
* VisibilityKind is an enumeration type that defines literals to determine the visibility of Elements
* in a model.
*/
export type VisibilityKind = 'public' | 'private' | 'protected' | 'package';

/**
* An Element is a constituent of a model. As such, it has the capability of owning other Elements.
*/
export interface ElementData {
	/**
	* Gets the element type.
	*/
	elementType: ElementType;
	/**
	* Indicates which stereotypes from the selected profile (or profiles) are applied to the element. The
	* selected profiles are the profiles that are applied to the containing package.
	*/
	appliedStereotypes?: string[];
	/**
	* Gets the unique ID of the element.
	*/
	id: string;
	/**
	* The Comments owned by this Element.
	*/
	ownedComments?: CommentData[];
	/**
	* Contains 0 or more tagged values for the element.
	*/
	taggedValues?: TaggedValueSpecificationData[];
}

/**
* A NamedElement is an Element in a model that may have a name. The name may be given directly and/or
* via the use of a StringExpression.
*/
export interface NamedElementData extends ElementData {
	/**
	* The name of the NamedElement.
	*/
	name: string;
	/**
	* Determines whether and how the NamedElement is visible outside its owning Namespace.
	*/
	visibility?: VisibilityKind;
}

/**
* A TypedElement is a NamedElement that may have a Type specified for it.
*/
export interface TypedElementData extends NamedElementData {
	/**
	* The type of the TypedElement.
	*/
	type?: string;
}

/**
* A ValueSpecification is the specification of a (possibly empty) set of values.
*/
export interface ValueSpecificationData extends TypedElementData {
}

/**
* A PackageableElement is a NamedElement that may be owned directly by a Package.
*/
export interface PackageableElementData extends NamedElementData {
}

/**
* A Type constrains the values represented by a TypedElement.
*/
export interface TypeData extends PackageableElementData {
	/**
	* If true, the type was inferred by a tool, for example during data import. An inferred type is never
	* owned by any Package.
	*/
	isInferred: boolean;
}

/**
* Specifies the value of a meta attribute (tagged value) for a particular element.
*/
export interface TaggedValueSpecificationData {
	/**
	* Refers to the tagged value definition (metaattribute) of the tagged value's stereotype.
	*/
	definition: string;
	/**
	* Specifies the actual tagged value.
	*/
	specification: ValueSpecificationData;
}

/**
* A RedefinableElement is an element that, when defined in the context of a Classifier, can be
* redefined more specifically or differently in the context of another Classifier that specializes
* (directly or indirectly) the context Classifier.
*/
export interface RedefinableElementData extends NamedElementData {
	/**
	* Indicates whether it is possible to further redefine a RedefinableElement. If the value is true,
	* then it is not possible to further redefine the RedefinableElement.
	*/
	isLeaf: boolean;
}

/**
* A Classifier represents a classification of instances according to their Features.
*/
export interface ClassifierData extends TypeData, RedefinableElementData {
	/**
	* The Generalization relationships for this Classifier. These Generalizations navigate to more general
	* Classifiers in the generalization hierarchy.
	*/
	generalizations?: GeneralizationData[];
	/**
	* If true, the Classifier can only be instantiated by instantiating one of its specializations. An
	* abstract Classifier is intended to be used by other Classifiers e.g., as the target of Associations
	* or Generalizations.
	*/
	isAbstract: boolean;
	/**
	* If true, the Classifier cannot be specialized.
	*/
	isFinalSpecialization: boolean;
}

/**
* StructuredClassifiers may contain an internal structure of connected elements each of which plays a
* role in the overall Behavior modeled by the StructuredClassifier.
*/
export interface StructuredClassifierData extends ClassifierData {
}

/**
* A multiplicity is a definition of an inclusive interval of non-negative integers beginning with a
* lower bound and ending with a (possibly infinite) upper bound. A MultiplicityElement embeds this
* information to specify the allowable cardinalities for an instantiation of the Element.
*/
export interface MultiplicityElementData extends ElementData {
	/**
	* For a multivalued multiplicity, this attribute specifies whether the values in an instantiation of
	* this MultiplicityElement are sequentially ordered.
	*/
	isOrdered: boolean;
	/**
	* For a multivalued multiplicity, this attributes specifies whether the values in an instantiation of
	* this MultiplicityElement are unique.
	*/
	isUnique: boolean;
	/**
	* The specification of the lower bound for this multiplicity.
	*/
	lowerValue?: ValueSpecificationData;
	/**
	* The specification of the upper bound for this multiplicity.
	*/
	upperValue?: ValueSpecificationData;
}

/**
* Defines a common interface for named elements that are part of an ordered collection.
*/
export interface OrderedElementData extends ElementData {
	/**
	* Gets or set the sort order of the element if it is part of a collection. The value is 0 for elements
	* to which no particular ordering applies. Elements with a lower order come before elements with a
	* higher order.
	*/
	order: number;
}

/**
* A Feature declares a behavioral or structural characteristic of Classifiers.
*/
export interface FeatureData extends RedefinableElementData, OrderedElementData {
	/**
	* Specifies whether this Feature characterizes individual instances classified by the Classifier
	* (false) or the Classifier itself (true).
	*/
	isStatic: boolean;
}

/**
* A StructuralFeature is a typed feature of a Classifier that specifies the structure of instances of
* the Classifier.
*/
export interface StructuralFeatureData extends FeatureData, MultiplicityElementData, TypedElementData {
	/**
	* If isReadOnly is true, the StructuralFeature may not be written to after initialization.
	*/
	isReadOnly: boolean;
}

/**
* Each stereotype may extend one or more metaclasses through a StereoTypeExtension.
*/
export interface StereotypeExtensionData {
	/**
	* A required extension means that an instance of a stereotype must always be linked to an instance of
	* the extended metaclass. The instance of the stereotype is typically deleted only when either the
	* instance of the extended metaclass is deleted, or when the profile defining the stereotype is
	* removed from the applied profiles of the package.  
	*/
	isRequired: boolean;
	metaClass: ElementType;
}

/**
* Defines a common interface for Classifiers (Class, DataType and Interface) that have attributes and
* operations.
*/
export interface MemberedClassifierData extends ClassifierData {
	/**
	* The attributes owned by the Element. Note that in UML, OwnedAttributes is a property of derived
	* classes of Classifier (Class, DataType and Interface).
	*/
	ownedAttributes?: PropertyData[];
	/**
	* The Operations owned by the Element. Note that in UML, OwnedOperations is a property of derived
	* classes of Classifier (Class, DataType and Interface).
	*/
	ownedOperations?: OperationData[];
}

/**
* A BehavioredClassifier may have InterfaceRealizations, and owns a set of Behaviors one of which may
* specify the behavior of the BehavioredClassifier itself.
*/
export interface BehavioredClassifierData extends ClassifierData {
	/**
	* The set of InterfaceRealizations owned by the BehavioredClassifier. Interface realizations reference
	* the Interfaces of which the BehavioredClassifier is an implementation.
	*/
	interfaceRealizations?: InterfaceRealizationData[];
}

/**
* A Class classifies a set of objects and specifies the features that characterize the structure and
* behavior of those objects. A Class may have an internal structure and Ports.
*/
export interface ClassData extends BehavioredClassifierData, StructuredClassifierData, MemberedClassifierData {
	/**
	* Determines whether an object specified by this Class is active or not. If true, then the owning
	* Class is referred to as an active Class. If false, then such a Class is referred to as a passive
	* Class.
	*/
	isActive: boolean;
}

/**
* Stereotype is a profile class which defines how an existing metaclass may be extended as part of a
* profile. It enables the use of a platform or domain specific terminology or notation in place of, or
* in addition to, the ones used for the extended metaclass.
*/
export interface StereotypeData extends ClassData {
	extends?: StereotypeExtensionData[];
	/**
	* Gets a name for the stereotype that is safe to use in Javascript.
	*/
	safeName: string;
}

/**
* Relationship is an abstract concept that specifies some kind of relationship between Elements.
*/
export interface RelationshipData extends ElementData {
}

/**
* A Property is a StructuralFeature. A Property related by ownedAttribute to a Classifier (other than
* an association) represents an attribute and might also represent an association end. It relates an
* instance of the Classifier to a value or set of values of the type of the attribute. A Property
* related by memberEnd to an Association represents an end of the Association. The type of the
* Property is the type of the end of the Association.
*/
export interface PropertyData extends StructuralFeatureData {
	aggregation: AggregationKind;
	/**
	* A ValueSpecification that is evaluated to give a default value for the Property when an instance of
	* the owning Classifier is instantiated.
	*/
	defaultValue?: ValueSpecificationData;
	/**
	* Specifies whether the property is derived as the union of all of the Properties that are constrained
	* to subset it.
	*/
	isDerived: boolean;
	/**
	* Specifies whether the property is derived as the union of all of the Properties that are constrained
	* to subset it.
	*/
	isDerivedUnion: boolean;
	/**
	* True indicates this property can be used to uniquely identify an instance of the containing Class.
	*/
	isID: boolean;
	/**
	* Returns true if the Property is owned by a classifier or is included in the NavigableOwnedEnds of an
	* association.
	*/
	isNavigable: boolean;
}

/**
* A package is used to group elements, and provides a namespace for the grouped elements.
* A package can have one or more profile applications to indicate which profiles have been applied.
* Because a profile is a package, it is possible to apply a profile not only to packages, but also to
* profiles.
*/
export interface PackageData extends PackageableElementData {
	appliedProfiles?: string[];
	/**
	* Denotes where the namespace structure for your class model starts; all nested packages below a
	* namespace root will form the namespace hierarchy for contained types.
	*/
	isNamespaceRoot: boolean;
	/**
	* Specifies the packageable elements that are owned by this Package.
	*/
	packagedElements?: PackageableElementData[];
}

/**
* Metamodel customizations are defined in a profile, which is then applied to a package. A profile can
* define classes, stereotypes, data types, primitive types, enumerations. Stereotypes are specific
* metaclasses, tagged values are standard metaattributes, and profiles are specific kinds of packages.
*/
export interface ProfileData extends PackageData {
	/**
	* Gets a name for the profile that is safe to use in Javascript.
	*/
	safeName: string;
}

/**
* A DataType is similar to a Class; however, instances of data type are identified only by their
* value. If two data types have the same value, the instances are considered identical.
*/
export interface DataTypeData extends MemberedClassifierData {
}

/**
* A PrimitiveType defines a predefined DataType, without any substructure. A PrimitiveType may have an
* algebra and operations defined outside of UML, for example, mathematically.
*/
export interface PrimitiveTypeData extends DataTypeData {
}

/**
* ParameterDirectionKind is an Enumeration that defines literals used to specify direction of
* parameters.
*/
export type ParameterDirectionKind = 'in' | 'inout' | 'out' | 'return';

/**
* A Parameter is a specification of an argument used to pass information into or out of an invocation
* of a BehavioralFeature. Parameters can be treated as ConnectableElements within Collaborations.
*/
export interface ParameterData extends TypedElementData, MultiplicityElementData, OrderedElementData {
	/**
	* Specifies a ValueSpecification that represents a value to be used when no argument is supplied for
	* the Parameter.
	*/
	defaultValue?: ValueSpecificationData;
	direction: ParameterDirectionKind;
	/**
	* Tells whether an output parameter may emit a value to the exclusion of the other outputs.
	*/
	isException: boolean;
	/**
	* Tells whether an input parameter may accept values while its behavior is executing, or whether an
	* output parameter may post values while the behavior is executing.
	*/
	isStream: boolean;
}

/**
* A BehavioralFeature is a feature of a Classifier that specifies an aspect of the behavior of its
* instances. A BehavioralFeature is implemented (realized) by a Behavior. A BehavioralFeature
* specifies that a Classifier will respond to a designated request by invoking its implementing
* method.
*/
export interface BehavioralFeatureData extends FeatureData {
	/**
	* If true, then the BehavioralFeature does not have an implementation, and one must be supplied by a
	* more specific Classifier. If false, the BehavioralFeature must have an implementation in the
	* Classifier or one must be inherited.
	*/
	isAbstract: boolean;
	/**
	* The parameters owned by this Operation.
	*/
	ownedParameters?: ParameterData[];
}

/**
* An Operation is a BehavioralFeature of a Classifier that specifies the name, type, parameters, and
* constraints for invoking an associated Behavior. An Operation may invoke both the execution of
* method behaviors as well as other behavioral responses.
*/
export interface OperationData extends BehavioralFeatureData {
	/**
	* Specifies if the operation is a class constructor.
	*/
	isConstructor: boolean;
	/**
	* Specifies whether an execution of the BehavioralFeature leaves the state of the system unchanged
	* (isQuery=true) or whether side effects may occur (isQuery=false).
	*/
	isQuery: boolean;
}

/**
* Represents the top-level package.
*/
export interface ModelData extends PackageData {
}

/**
* A LiteralSpecification identifies a literal constant being modeled.
*/
export interface LiteralSpecificationData extends ValueSpecificationData {
}

/**
* A LiteralUnlimitedNatural is a specification of an UnlimitedNatural number.
*/
export interface LiteralUnlimitedNaturalData extends LiteralSpecificationData {
	/**
	* The specified UnlimitedNatural value.
	*/
	value: string;
}

/**
* A LiteralString is a specification of a String value.
*/
export interface LiteralStringData extends LiteralSpecificationData {
	/**
	* The specified String value.
	*/
	value: string;
}

/**
* A LiteralReal is a specification of a Real value.
*/
export interface LiteralRealData extends LiteralSpecificationData {
	/**
	* The specified Real value.
	*/
	value: number;
}

/**
* A LiteralNull specifies the lack of a value.
*/
export interface LiteralNullData extends LiteralSpecificationData {
}

/**
* A LiteralInteger is a specification of an Integer value.
*/
export interface LiteralIntegerData extends LiteralSpecificationData {
	/**
	* The specified Integer value.
	*/
	value: number;
}

/**
* A LiteralBoolean is a specification of a Boolean value.
*/
export interface LiteralBooleanData extends LiteralSpecificationData {
	/**
	* The specified Boolean value.
	*/
	value: boolean;
}

/**
* A DirectedRelationship represents a relationship between a collection of source model Elements and a
* collection of target model Elements.
*/
export interface DirectedRelationshipData extends RelationshipData {
}

/**
* An InterfaceRealization is a specialized realization relationship between a BehavioredClassifier and
* an Interface. This relationship signifies that the realizing BehavioredClassifier conforms to the
* contract specified by the Interface.
*/
export interface InterfaceRealizationData extends DirectedRelationshipData {
	/**
	* References the Interface specifying the conformance contract.
	*/
	contract: string;
}

/**
* Interfaces declare coherent services that are implemented by BehavioredClassifiers that implement
* the Interfaces via InterfaceRealizations.
*/
export interface InterfaceData extends MemberedClassifierData {
}

/**
* A Generalization is a taxonomic relationship between a more general Classifier and a more specific
* Classifier. Each instance of the specific Classifier is also an instance of the general
* Classifier.The specific Classifier inherits the features of the more general Classifier. A
* Generalization is owned by the specific Classifier.
*/
export interface GeneralizationData extends DirectedRelationshipData {
	/**
	* The general classifier in the Generalization relationship.
	*/
	general: string;
	/**
	* Indicates whether the specific Classifier can be used wherever the general Classifier can be used.
	* If true, the execution traces of the specific Classifier shall be a superset of the execution traces
	* of the general Classifier. If false, there is no such constraint on execution traces. If unset, the
	* modeler has not stated whether there is such a constraint or not.
	*/
	isSubstitutable: boolean;
}

/**
* An EnumerationLiteral is a user-defined data value for an Enumeration.
*/
export interface EnumerationLiteralData extends NamedElementData, OrderedElementData {
	specification: ValueSpecificationData;
}

/**
* An Enumeration is a DataType whose values are enumerated in the model as EnumerationLiterals.
*/
export interface EnumerationData extends DataTypeData {
	/**
	* Gets the base type of the enumeration. For most programming language, this is an integral type if
	* not specified.
	*/
	baseType?: string;
	/**
	* The ordered set of literals owned by this Enumeration.
	*/
	ownedLiterals?: EnumerationLiteralData[];
}

export interface DocumentReferenceData {
	location: DocumentLocationKind;
	/**
	* Gets the name of the reference. If the reference is a NPM reference, this field contains the package
	* name (including any @scope). If the reference is a local one, this field contains the file name
	* without extension.
	*/
	name: string;
	path: string;
}

export type DocumentLocationKind = 'local' | 'npm';

export interface DocumentData {
	creator: string;
	/**
	* Gets the unique ID of the document.
	*/
	id: string;
	/**
	* Contains the main model structure.
	*/
	model?: ModelData;
	modelTypeName: string;
	modelTypeVersion: string;
	/**
	* Contains a model with 0 or more profiles (packages) in it.
	*/
	profiles?: ModelData;
	references?: DocumentReferenceData[];
}

/**
* A Comment is a textual annotation that can be attached to a set of Elements.
*/
export interface CommentData extends ElementData {
	body: string;
}

/**
* Associations represent relationships between classes.
*/
export interface AssociationData extends RelationshipData, ClassifierData {
	/**
	* Gets all ends of the association, that is, ends that are either owned by the association or by a
	* classifier (as attributes).
	*/
	memberEnds?: string[];
	/**
	* The ends that are owned by the Association itself.
	*/
	ownedEnds?: PropertyData[];
}

/**
* AggregationKind is an Enumeration for specifying the kind of aggregation of a Property.
*/
export type AggregationKind = 'none' | 'shared' | 'composite';

/**
* Contents from partial file ./data-interfaces.partial.ts.
*/

/**
 * Augments the generated DocumentReferenceData with a document property that is used
 * internally.
 */
export interface DocumentReferenceData {
    /**
     * Contains the document data for the reference document. This field only has a value
     * after the referenced document is loaded. This is done by the host process.
     */
    document: DocumentData;
}

