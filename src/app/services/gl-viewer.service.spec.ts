import { TestBed } from '@angular/core/testing';

import { GlViewerService } from './gl-viewer.service';

describe('GlViewerService', () => {
  let service: GlViewerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlViewerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
