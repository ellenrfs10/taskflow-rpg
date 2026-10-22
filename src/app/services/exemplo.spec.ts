import { TestBed } from '@angular/core/testing';
import { Exemplo } from './exemplo';

describe('Exemplo', () => {
  let service: Exemplo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Exemplo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
