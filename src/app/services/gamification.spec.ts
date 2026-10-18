import { TestBed } from '@angular/core/testing';
import { Gamification } from './gamification';

describe('Gamification', () => {
  let service: Gamification;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Gamification);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
