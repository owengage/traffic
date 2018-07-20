import TRANSFORM_KEY from './transform-key'
import TransformComponent from './transform-component'
import Point from '../point'

import _ from 'lodash'

export default class Entity {
    constructor() {
        this._id = _.uniqueId('entity-');
        this._components = {};
        this._parent = null;
        this._children = [];
    }

    get parent() {
        return this._parent;
    }

    get children() {
        return this._children;
    }

    set parent(parent_entity) {
        this._parent = parent_entity;
        parent_entity.add_entity(this);
    }

    add_entity(entity) {
        this._children.push(entity);
    }


    add_component(component) {
        const key = component.get_key();
        this._components[key] = this._components[key] || [];
        this._components[key].push(component);
    }

    components(key) {
        if (key && typeof key === "symbol") {
            return this._components[key] || [];
        }
        else {
            throw new Error("key must be a symbol");
        }
    }

    optional_component(key) {
        if (key && typeof key === "symbol") {
            const comps = this._components[key] || [];
            if (comps.length <= 1) {
                return comps[0] || null;
            } else {
                throw new Error(`Wanted single component with ${key.toString()}, found multiple.`);
            }
        }
        else {
            throw new Error("key must be a symbol");
        }
    }

    required_component(key) {
        if (key && typeof key === "symbol") {
            const comps = this._components[key] || [];
            if (comps.length === 1) {
                return comps[0];
            } else if (comps.length === 0) {
                throw new Error(`Require single component with ${key.toString()}, found none.`);
            } else {
                throw new Error(`Require single component with ${key.toString()}, found multiple.`);
            }
        }
        else {
            throw new Error("key must be a symbol");
        }
    }

    get_overall_transform() {
        const lineage = [this.required_component(TRANSFORM_KEY)];

        let parent = this.parent;
        while (parent) {
            lineage.push(parent.required_component(TRANSFORM_KEY));
            parent = parent.parent;
        }
        
        let transform = new TransformComponent(new Point(0,0), 0);
        for (const trans of lineage.reverse()) {
            transform = transform.apply(trans);
        }

        return transform;
    }
}
