import { Component } from '@angular/core';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css'],
})
export class ServicesComponent {
  services = [
    {
      name: 'Hair Braiding',
      image: '../../assets/Hair-braiding.jpg',
      price: '$80',
      description:
        'Experience the artistry of our expert braiders who specialize in everything from classic cornrows to intricate box braids and protective styles. Our skilled stylists combine traditional techniques with modern trends to create stunning, long-lasting braids that protect and enhance your natural hair. Each braiding service includes a consultation to understand your desired style and hair care needs.',
    },
    {
      name: 'Hair Dressing',
      image: '../../assets/Hair-dressing.jpg',
      price: '$65',
      description:
        'Transform your look with our comprehensive hair dressing services. Whether you are seeking a bold new cut, vibrant color, or elegant styling for a special occasion, our experienced stylists will bring your vision to life. We use premium products and the latest techniques to ensure your hair looks and feels its best. From classic updos to contemporary styles, we got you covered.',
    },
    {
      name: 'Pedicure & Manicure',
      image: '../../assets/Manicure.jpg',
      price: '$75',
      description:
        'Indulge in our luxurious nail care treatments that combine relaxation with beauty. Our signature mani-pedi service includes aromatic soaks, gentle exfoliation, expert nail shaping, and cuticle care. Choose from our extensive collection of premium polishes or opt for long-lasting gel treatments. Each service concludes with a soothing massage to leave you feeling refreshed and pampered.',
    },
    {
      name: 'Massage Therapy',
      image: '../../assets/massage.jpg',
      price: '$75',
      description:
        'Escape into tranquility with our therapeutic massage services. Our skilled therapists offer a range of techniques including Swedish, deep tissue, and aromatherapy massage. Each session is customized to address your specific needs, whether you are seeking stress relief, pain management, or pure relaxation. Experience the perfect blend of therapeutic touch and luxurious pampering.',
    },
    {
      name: 'Professional Waxing',
      image: '../../assets/Waxing.jpg',
      price: '$30',
      description:
        'Achieve smooth, long-lasting results with our professional waxing services. Our experienced estheticians use premium, gentle wax formulas suitable for all skin types. We prioritize your comfort and safety while ensuring effective hair removal. From facial waxing to full-body services, our experts provide precise, thorough treatment with minimal discomfort.',
    },
  ];


}
