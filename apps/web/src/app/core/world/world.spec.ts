import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';

import { ActiveWorld, currentness, pathOf, worldOfPath } from './world';

describe('pathOf', () => {
  it('drops the query, the fragment and a trailing slash', () => {
    expect(pathOf('/developpeur/?ref=home#travaux')).toBe('/developpeur');
    expect(pathOf('/?x=1')).toBe('/');
    expect(pathOf('')).toBe('/');
  });
});

describe('worldOfPath', () => {
  it('reads the world from the section', () => {
    expect(worldOfPath('/developpeur', 'cgi')).toBe('dev');
    expect(worldOfPath('/developpeur/kasa-openclassrooms', 'cgi')).toBe('dev');
    expect(worldOfPath('/graphisme-3d', 'dev')).toBe('cgi');
    expect(worldOfPath('/graphisme-3d/gorgotte', 'dev')).toBe('cgi');
  });

  it('keeps the world the visitor came from on contact and the 404', () => {
    expect(worldOfPath('/contact', 'cgi')).toBe('cgi');
    expect(worldOfPath('/contact', 'dev')).toBe('dev');
    expect(worldOfPath('/404', 'cgi')).toBe('cgi');
  });

  it('keeps the world on any page outside the sections', () => {
    expect(worldOfPath('/', 'cgi')).toBe('cgi');
  });

  it('does not mistake a prefix for a section', () => {
    expect(worldOfPath('/developpeurs', 'cgi')).toBe('cgi');
  });

  it('reads the English tree’s sections in English', () => {
    expect(worldOfPath('/developer/kasa', 'cgi', 'en')).toBe('dev');
    expect(worldOfPath('/3d-art', 'dev', 'en')).toBe('cgi');
    expect(worldOfPath('/contact', 'cgi', 'en')).toBe('cgi');
    expect(worldOfPath('/developpeur', 'cgi', 'en')).toBe('cgi');
  });
});

describe('currentness', () => {
  it('marks the page itself, then its section', () => {
    expect(currentness('/developpeur', '/developpeur')).toBe('page');
    expect(currentness('/developpeur/kasa', '/developpeur')).toBe('true');
    expect(currentness('/graphisme-3d', '/developpeur')).toBeNull();
  });
});

describe('ActiveWorld', () => {
  afterEach(() => document.documentElement.removeAttribute('data-world'));

  function create(): ActiveWorld {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    return TestBed.inject(ActiveWorld);
  }

  it('stamps the world on the document, and keeps it on contact', () => {
    const active = create();
    const root = document.documentElement;

    active.enter('/graphisme-3d');
    expect(root.getAttribute('data-world')).toBe('cgi');

    active.enter('/contact');
    expect(root.getAttribute('data-world')).toBe('cgi');
    expect(active.path()).toBe('/contact');
  });

  it('opens contact in the developer world when no world came before it', () => {
    const active = create();
    active.enter('/contact');
    expect(active.world()).toBe('dev');
  });

  it('starts from the address the page was loaded at, before any navigation', () => {
    // jsdom loads at /, which is outside both sections.
    expect(create().path()).toBe('/');
    expect(document.documentElement.getAttribute('data-world')).toBe('dev');
  });
});
