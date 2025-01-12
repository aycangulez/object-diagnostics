// @ts-check

import { expect } from 'chai';
import { assert, ObjectDiagnostics } from '../index.js';

const SiteOrganizer = function () {
    const siteMap = new Map();

    this.diagnostics = () => {
        function checkChildren(children) {
            let status = true;
            children.forEach((siteId) => siteMap.has(siteId) || (status = false));
            return status;
        }

        siteMap.forEach((site) => {
            assert(site.id !== site.parentId, `Site ${site.name} cannot be its own parent.`);
            assert(site.parentId === null || siteMap.has(site.parentId), `Parent site of ${site.name} must exist.`);
            assert(checkChildren(site.children), `Site ${site.name} must have valid children.`);
        });
    };

    this.addSite = (site) => {
        assert(!siteMap.has(site.id), `Site ${site.name} should not have been added before.`);
        assert(site.id !== site.parentId, `Site ${site.name} cannot be its own parent.`);
        assert(site.parentId === null || siteMap.has(site.parentId), `Parent site of ${site.name} must exist.`);

        siteMap.set(site.id, { ...site, children: new Set() });
        if (site.parentId !== null) {
            siteMap.get(site.parentId).children.add(site.id);
        }

        assert(siteMap.has(site.id), `Added site ${site.name}.`);
        assert(
            site.parentId !== null ? siteMap.get(site.parentId).children.has(site.id) : true,
            `Added site ${site.name} as sub site.`
        );
        return this;
    };

    this.removeSite = (siteId) => {
        assert(siteMap.has(siteId), `Site #${siteId} must exist.`);
        assert(siteMap.get(siteId).children.size === 0, `Site #${siteId} must have no children.`);

        const site = siteMap.get(siteId);
        if (site.parentId !== null) {
            siteMap.get(site.parentId).children.delete(siteId);
        }
        siteMap.delete(siteId);
        return this;
    };

    this.getSite = (siteId) => {
        return siteMap.get(siteId);
    };

    this.getSites = () => siteMap;
};

function generateTestCase() {
    return new ObjectDiagnostics().addTo(
        new SiteOrganizer()
            .addSite({ id: 1, name: 'HQ', parentId: null })
            .addSite({ id: 2, name: 'Regional Office A', parentId: 1 })
            .addSite({ id: 3, name: 'Regional Office B', parentId: 1 })
            .addSite({ id: 4, name: 'Local Site A1', parentId: 2 })
            .addSite({ id: 5, name: 'Local Site B1', parentId: 3 })
    );
}

describe('Doing the following will trigger a diagnostics call', function () {
    const errMsg = 'Parent site of Regional Office A must exist.';

    it('Calling a method', function () {
        const sampleSites = generateTestCase();
        expect(sampleSites.getSite(1)).to.include({ name: 'HQ' });
        sampleSites.getSites().get(2).parentId = 100;
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
