import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { ShopComponent } from './shop.component';
import { Reward } from '../../models/reward.model';
import { GamificationService } from '../../services/gamification.service';
import { ShopService } from '../../services/shop.service';
import { SupabaseService } from '../../services/supabase-service';

const REWARDS: Reward[] = [
  { id: '1', title: 'Noite de cinema', description: '', cost: 50, icon: '🍿', category: 'Lazer' },
  { id: '2', title: 'Escolher o jantar', description: '', cost: 40, icon: '🍕', category: 'Guloseimas' }
];

describe('ShopComponent', () => {
  let component: ShopComponent;
  let fixture: ComponentFixture<ShopComponent>;
  let rewards: WritableSignal<Reward[]>;

  beforeEach(async () => {
    rewards = signal<Reward[]>([]);

    // Serviços falsos: o teste não faz pedidos de rede ao Supabase
    await TestBed.configureTestingModule({
      imports: [ShopComponent],
      providers: [
        {
          provide: ShopService,
          useValue: {
            rewards,
            loading: signal(false),
            error: signal<string | null>(null),
            loadRewards: () => { },
            addReward: () => ({ subscribe: () => { } }),
            deleteReward: () => ({ subscribe: () => { } })
          }
        },
        {
          provide: GamificationService,
          useValue: { userProfile: signal({ id: 'u1', coins: 100 }), spendCoins: async () => true }
        },
        { provide: SupabaseService, useValue: { supabaseClient: {} } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra a mensagem de lista vazia quando não há prémios', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Nenhum prémio encontrado');
  });

  it('filtra os prémios por categoria', () => {
    rewards.set(REWARDS);
    component.filterByCategory('Lazer');

    const titles = component.filteredRewards().map((r) => r.title);
    expect(titles).toEqual(['Noite de cinema']);
  });
});
