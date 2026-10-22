import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Exemplo } from './services/exemplo';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{
  private exemplo = inject(Exemplo)
  title = 'taskflow-rpg';
  async ngOnInit() {
     const user = await this.exemplo.getUser()
    console.log(user) 
    
    
  }

}
