import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'],
})
export class HomepageComponent implements OnInit, OnDestroy {
  images = [
    '../../assets/woman.jpg',
    '../../assets/salon.jpg',
    '../../assets/massage.jpg',
  ];

  currentSlide = 0;
  private slideInterval: any;

  ngOnInit() {
    this.startSlideShow();
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  private startSlideShow() {
    this.slideInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.images.length;
    }, 5000);
  }
}
