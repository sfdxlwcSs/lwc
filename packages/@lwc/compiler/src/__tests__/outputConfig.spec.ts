/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { compile } from '../index';

describe('outputConfig.compat', () => {
    it("shouldn't apply proxy transformation by default", async () => {
        const output = await compile({
            namespace: 'x',
            name: 'test',
            files: {
                'test.js': 'export const value = foo.bar;',
            },
        });

        expect(output.result.code).toContain('const value = foo.bar;');
    });

    it('applies proxy transformation when outputConfig.compat is true', async () => {
        const output = await compile({
            namespace: 'x',
            name: 'test',
            outputConfig: {
                compat: true,
            },
            files: {
                'test.js': 'export const value = foo.bar;',
            },
        });

        expect(output.result.code).toContain(
            'var value = foo._ES5ProxyType ? foo.get("bar") : foo.bar'
        );
    });
});

describe('outputConfig.env', () => {
    it('replaces the environment variable with the right value', async () => {
        const output = await compile({
            namespace: 'x',
            name: 'test',
            outputConfig: {
                env: {
                    NODE_ENV: 'test',
                },
            },
            files: {
                'test.js': 'export const env = process.env.NODE_ENV;',
            },
        });

        expect(output.result.code).toContain('const env = "test";');
    });

    it('tree-shakes properly dead code after replacement', async () => {
        const output = await compile({
            namespace: 'x',
            name: 'test',
            outputConfig: {
                env: {
                    NODE_ENV: 'test',
                },
            },
            files: {
                'test.js': 'export const isTest = process.env.NODE_ENV === "test" ? true : false;',
            },
        });

        expect(output.result.code).toContain('true');
        expect(output.result.code).not.toContain('false');
    });
});

describe('outputConfig.minify', () => {
    const files = {
        'test.js': `/* comment */ import html from './test.html'; const value = foo.bar ; export { html, value };`,
        'test.html': `<template><!-- comment --></template>`,
        'test.css': '/* comment */',
    };

    it("shouldn't apply minification by default", async () => {
        const output = await compile({
            namespace: 'x',
            name: 'test',
            files,
        });

        expect(output.result.code).toContain('const value = foo.bar;');
        expect(output.result.code).toContain('comment');
    });

    it('minifies the code and strip out the comments if outputConfig.minify is true', async () => {
        const output = await compile({
            namespace: 'x',
            name: 'test',
            files,
            outputConfig: {
                minify: true,
            },
        });

        expect(output.result.code).toMatch(/const \w=foo.bar;/);
        expect(output.result.code).not.toContain('comment');
    });
});
