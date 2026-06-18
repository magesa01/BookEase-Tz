import { Calendar, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoryLabels, type Category } from '../types';



const categoryOrder: Category[] = ['salon', 'barbershop', 'clinic', 'beauty_center', 'car_wash'];

export function Footer() {
  const getCategoryHref = (categoryKey: Category) => {
    const label = categoryLabels[categoryKey];
    return `/search?category=${encodeURIComponent(label)}`;
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-8 w-8 text-teal-400" />
              <span className="text-xl font-bold text-white">BookEase TZ</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Book your time, skip the line. Tanzania's premier service booking platform.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-teal-400 transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-teal-400 transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-teal-400 transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-teal-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-teal-400 transition-colors">
                  Browse Services
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              {categoryOrder.map((key) => (
                <li key={key}>
                  <Link
                    to={getCategoryHref(key)}
                    className="hover:text-teal-400 transition-colors"
                  >
                    {categoryLabels[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <span>Dar es Salaam, Tanzania</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <a
                  className="hover:text-teal-400 transition-colors"
                  href="tel:+255757737713"
                >
                  +255 757 737 713
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <a
                  className="hover:text-teal-400 transition-colors"
                  href="mailto:johnaugustine900@gmail.com"
                >
                  johnaugustine900@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} BookEase TZ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

