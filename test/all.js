// @ts-check

import { expect } from 'chai';
import { cloneDeep } from 'lodash-es';
import { assert, ObjectDiagnostics } from '../index.js';

const SiteOrganizer = function () {
    const siteMap = new Map();

    function checkChildren(children) {
        let status = true;
        children.forEach((siteId) => siteMap.has(siteId) || (status = false));
        return status;
    }

    function checkInvariants(site) {
        assert(site.id !== site.parentId, `Site ${site.name} may not be its own parent.`);
        assert(site.parentId === null || siteMap.has(site.parentId), `Parent site of ${site.name} doesn't exist.`);
        assert(site.children ? checkChildren(site.children) : true, `Site ${site.name} has invalid children.`);
    }

    this.addSite = (site) => {
        assert(!siteMap.has(site.id), `Site ${site.name} already exists.`);
        checkInvariants(site);

        //siteMap.set(site.id, { ...cloneDeep(site), children: new Set() });
        siteMap.set(site.id, { ...site, children: new Set() });
        if (site.parentId !== null) {
            siteMap.get(site.parentId).children.add(site.id);
        }
        return this;
    };

    this.removeSite = (siteId) => {
        assert(siteMap.has(siteId), `Site #${siteId} doesn't exist.`);
        assert(siteMap.get(siteId).children.size === 0, `Site #${siteId} has sub sites.`);

        const site = siteMap.get(siteId);
        if (site.parentId !== null) {
            siteMap.get(site.parentId).children.delete(siteId);
        }
        siteMap.delete(siteId);
        return this;
    };

    this.getSite = (siteId) => {
        // return cloneDeep(siteMap.get(siteId));
        return siteMap.get(siteId);
    };

    this.diagnostics = () => {
        siteMap.forEach(checkInvariants);
    };

    return this;
};

function generateTestCase() {
    return new ObjectDiagnostics().add(
        new SiteOrganizer()
            .addSite({ id: 1, name: 'HQ', parentId: null })
            .addSite({ id: 2, name: 'Regional Office A', parentId: 1 })
            .addSite({ id: 3, name: 'Regional Office B', parentId: 1 })
            .addSite({ id: 4, name: 'Local Site A1', parentId: 2 })
            .addSite({ id: 5, name: 'Local Site B1', parentId: 3 })
    );
}

describe('Doing the following will trigger a diagnostics call', function () {
    const errMsg = "Parent site of Regional Office A doesn't exist.";

    it('Calling a method', function () {
        const sampleSites = generateTestCase();
        expect(sampleSites.getSite(1)).to.include({ name: 'HQ' });
        sampleSites.getSite(2).parentId = -1;
        expect(() => sampleSites.getSite(1)).to.throw(errMsg);
    });

    it('Defining a property', function () {
        const sampleSites = generateTestCase();
        sampleSites.getSite(2).parentId = -1;
        expect(() => Object.defineProperty(sampleSites, 'testProperty', { value: 42 })).to.throw(errMsg);
    });

    it('Setting a property', function () {
        const sampleSites = generateTestCase();
        sampleSites.getSite(2).parentId = -1;
        expect(() => (sampleSites.testProperty = 42)).to.throw(errMsg);
    });

    it('Deleting a property', function () {
        const sampleSites = generateTestCase();
        sampleSites.testProperty = 42;
        expect(sampleSites.getSite(1)).to.include({ name: 'HQ' });
        sampleSites.getSite(2).parentId = -1;
        expect(() => delete sampleSites.testProperty).to.throw(errMsg);
    });
});
