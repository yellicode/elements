/*
* Copyright (c) 2018 Yellicode
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
import { UniqueId } from '@yellicode/core';
import * as Interfaces from "./interfaces";
import * as Implementation from "./classes";
import { ModelDelegate } from "./model-delegate";

export class ElementFactory {
    public static createProperty(owner: Interfaces.Element): Interfaces.Property {
        let modelDelegate: ModelDelegate = (owner as any).modelDelegate || new ModelDelegate(null);
        const property = new Implementation.Property(modelDelegate, owner);
        property.id = UniqueId.create();
        return property;
    }

    public static createComment(owner: Interfaces.Element, body: string): Interfaces.Comment {
        let modelDelegate: ModelDelegate = (owner as any).modelDelegate || new ModelDelegate(null);
        const comment = new Implementation.Comment(modelDelegate, owner);
        comment.body = body;
        // property.id = UniqueId.create(); // a comment does not need an id
        return comment;
    }
}