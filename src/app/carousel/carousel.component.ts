import { Component, OnInit, Input } from '@angular/core';
import { Testimonial } from './carousel.interface';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css'],
  animations: [
    trigger('slideAnimation', [
      transition(':increment', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate(
          '500ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
      transition(':decrement', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate(
          '500ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
    ]),
  ],
})
export class CarouselComponent implements OnInit {
  @Input() testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Sarah Anderson',
      role: 'Regular Client',
      content:
        'Bolane Beauty Parlor is my go-to place for all my beauty needs. Their facial treatments have completely transformed my skin. The attention to detail and personalized care is exceptional!',
      image: '../../assets/Sarah.jpg',
    },
    {
      id: 2,
      name: 'Emily Chen',
      role: 'Bride',
      content:
        "I got my bridal makeup done at Bolane and I couldn't be happier! They perfectly captured the look I wanted and made me feel absolutely beautiful on my special day. The whole team is so talented and professional.",
      image: '../../assets/Emily.jpg',
    },
    {
      id: 3,
      name: 'Maria Rodriguez',
      role: 'Beauty Enthusiast',
      content:
        'The nail artists at Bolane are true artists! Their designs are creative and long-lasting. The spa pedicure experience is so relaxing, and the hygiene standards are impeccable.',
      image: '../../assets/Maria.jpg',
    },
    {
      id: 4,
      name: 'Lisa Thompson',
      role: 'Model',
      content:
        'As a model, I need to maintain a consistent skincare routine. The aestheticians at Bolane understand my skin perfectly and their treatments keep me camera-ready. Their hair styling services are equally amazing!',
      image: '../../assets/Lisa.jpg',
    },
  ];

  currentIndex = 0;
  autoPlayInterval: any;

  ngOnInit() {
    this.startAutoPlay();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.next();
    }, 5000);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
  }

  previous() {
    this.currentIndex =
      this.currentIndex === 0
        ? this.testimonials.length - 1
        : this.currentIndex - 1;
  }

  goToSlide(index: number) {
    this.currentIndex = index;
  }
}
