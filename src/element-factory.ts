/*
* Copyright (c) 2018 Yellicode
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
import { UniqueId } from '@yellicode/core';
import * as elements from "./interfaces";
import * as classes from "./classes";
import { ModelDelegateImpl } from "./model-delegate";

export class ElementFactory {
    public static createProperty(owner: elements.Element): elements.Property {
        let modelDelegate: ModelDelegateImpl = (owner as any).modelDelegate || new ModelDelegateImpl(null);
        const property = new classes.Property(modelDelegate, owner);
        property.id = UniqueId.create();
        return property;
    }

    public static createComment(owner: elements.Element, body: string): elements.Comment {
        let modelDelegate: ModelDelegateImpl = (owner as any).modelDelegate || new ModelDelegateImpl(null);
        const comment = new classes.Comment(modelDelegate, owner);
        comment.body = body;
        // property.id = UniqueId.create(); // a comment does not need an id
        return comment;
    }
}