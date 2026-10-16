import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-help',
  imports: [],
  templateUrl: './help.html'
})
export class Help {
  constructor(private router: Router) {
  }
 backtohome(){
      sessionStorage.removeItem('transportMode');

  this.router.navigate(['/dashboard']);
 }
}
