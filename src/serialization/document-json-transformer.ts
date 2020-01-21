/*
* Copyright (c) 2020 Yellicode
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { Document } from '../document';

const regularKeys = ['creator', 'id', 'model', 'modelTypeName', 'modelTypeVersion', 'profiles', 'references'];

export class DocumentJSONTransformer {
    /**
	* A custom replacer function that is used as a replacer callback using JSON.stringify.
	* @param {elements.Document} document The document in which the key was found.
	* @param {any} key The key being stringified.
	* @param {any} value The value being stringified.	
	*/
	public static toJSON(document: Document, key: any, value: any): any {
		if (value == null) 
			return undefined;

		if (regularKeys.indexOf(key) > -1)
			return value;
	}
}