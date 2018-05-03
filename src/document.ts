/*
* Copyright (c) 2018 Yellicode
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as Interfaces from "./interfaces";
import { ModelDelegate } from "./model-delegate";

export class Document implements Interfaces.Document {
    constructor(private modelDelegate: ModelDelegate) {

    }

    public id: string = '';
    public creator: string = '';
    public modelTypeName: string = '';
    public modelTypeVersion: string = '';
    public model: Interfaces.Model | null = null;
    public profiles: Interfaces.Model | null = null;
    public references: Interfaces.DocumentReference[] = [];

	/**
	* Returns an Element representing the element whose id property matches the specified string.
	* @returns {Interfaces.Element} The model element matching the specified ID, or null if no matching
	* element was found in the model.
	* @param {string} id The ID of the element to search for.
	*/
    public findElementById(id: string): Interfaces.Element | null {
        return this.modelDelegate.findElementById(id);
    }
}