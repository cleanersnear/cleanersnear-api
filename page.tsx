import type { Metadata } from "next";
import { RegularCleaningHero } from "./components/OnceoffCleaningHero";
import BeforeAfterGallery from '../components/BeforeAfterGallery'
import { WhatsIncluded } from "./components/WhatsIncluded";
import { PricingStructure } from "./components/PricingStructure";
import { Subscription } from "../components/Subscription";
import HomeLatestBlogs from "@/components/Home/HomeBlogs/HomeLatestBlogs";
import MainLayout from "@/components/layout/MainLayout";
import ReviewsSection from "./components/ReviewsSection";
import FAQSection from "./components/FAQSection";

export const metadata: Metadata = {
  title: "Once‑Off Deep Cleaning Melbourne | Spring Clean & One‑Time Clean | Cleaning Professionals",
  description:
    "Professional once‑off deep cleaning in Melbourne by Cleaning Professionals for move‑in/out, post‑renovation or seasonal refresh.",
  keywords: 'once off cleaning melbourne, deep cleaning melbourne, spring cleaning melbourne, move in cleaning melbourne, move out cleaning melbourne, post renovation cleaning melbourne, one time cleaning melbourne, thorough cleaning melbourne',
  alternates: { canonical: "https://www.cleaningprofessionals.com.au/services/once-off-cleaning" },
  openGraph: {
    title: "Once‑Off Deep Cleaning Melbourne | Spring Clean & One‑Time Clean | Cleaning Professionals",
    description:
      "Professional once‑off deep cleaning in Melbourne by Cleaning Professionals for move‑in/out, post‑renovation or seasonal refresh.",
    url: "https://www.cleaningprofessionals.com.au/services/once-off-cleaning",
    type: "article",
    images: [
      {
        url: 'https://www.cleaningprofessionals.com.au/images/deep-cleaning.png',
        width: 1200,
        height: 630,
        alt: 'Professional Once-Off Deep Cleaning Melbourne',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Once‑Off Deep Cleaning Melbourne | Spring Clean & One‑Time Clean | Cleaning Professionals",
    description:
      "Professional once‑off deep cleaning in Melbourne for move‑in/out, post‑renovation or seasonal refresh.",
    images: ['https://www.cleaningprofessionals.com.au/images/deep-cleaning.png'],
  },
};

export default function OnceOffCleaningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://www.cleaningprofessionals.com.au/services/once-off-cleaning#service",
    "name": "Once-Off Deep Cleaning Service Melbourne",
    "description": "Professional once-off deep cleaning service in Melbourne. Perfect for move-in/out, spring cleans, or post-renovation cleaning. Starting from $161 for 3 hours.",
    "serviceType": "Once-Off Deep Cleaning",
    "provider": { "@id": "https://www.cleaningprofessionals.com.au/#localbusiness" },
    "areaServed": {
      "@type": "City",
      "name": "Melbourne",
      "containedInPlace": {
        "@type": "State",
        "name": "Victoria"
      }
    },
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://www.cleaningprofessionals.com.au/book",
      "serviceSmsNumber": process.env.NEXT_PUBLIC_CONTACT_PHONE,
      "availableLanguage": "English"
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Standard Deep Clean",
        "description": "Comprehensive deep cleaning for most homes and apartments",
        "priceCurrency": "AUD",
        "price": "161.00",
        "priceValidUntil": "2025-12-31",
        "url": "https://www.cleaningprofessionals.com.au/book?selectedServices=Once-Off%20Cleaning",
        "availability": "https://schema.org/InStock",
        "eligibleRegion": "Melbourne",
        "validFrom": "2024-01-01",
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "Minimum Duration",
            "value": "3 hours"
          },
          {
            "@type": "PropertyValue", 
            "name": "Hourly Rate After Minimum",
            "value": "45"
          },
          {
            "@type": "PropertyValue",
            "name": "Service Type",
            "value": "Deep Cleaning"
          }
        ]
      },
      {
        "@type": "Offer",
        "name": "Premium Deep Clean", 
        "description": "Extensive cleaning for large homes or heavy-duty requirements",
        "priceCurrency": "AUD",
        "price": "296.00",
        "priceValidUntil": "2025-12-31",
        "url": "https://www.cleaningprofessionals.com.au/book?selectedServices=Once-Off%20Cleaning",
        "availability": "https://schema.org/InStock",
        "eligibleRegion": "Melbourne",
        "validFrom": "2024-01-01",
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "Minimum Duration",
            "value": "6 hours"
          },
          {
            "@type": "PropertyValue",
            "name": "Hourly Rate After Minimum", 
            "value": "45"
          },
          {
            "@type": "PropertyValue",
            "name": "Service Type",
            "value": "Premium Deep Cleaning"
          }
        ]
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Once-Off Cleaning Packages",
      "itemListElement": [
        { 
          "@type": "Offer", 
          "name": "Standard Deep Clean", 
          "url": "https://www.cleaningprofessionals.com.au/book?selectedServices=Once-Off%20Cleaning",
          "description": "Comprehensive deep cleaning for most homes"
        },
        { 
          "@type": "Offer", 
          "name": "Premium Deep Clean", 
          "url": "https://www.cleaningprofessionals.com.au/book?selectedServices=Once-Off%20Cleaning",
          "description": "Extensive cleaning for large homes"
        },
      ],
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "1200",
      "bestRating": "5",
      "worstRating": "1"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.cleaningprofessionals.com.au" },
        { "@type": "ListItem", position: 2, name: "Services", item: "https://www.cleaningprofessionals.com.au/services" },
        { "@type": "ListItem", position: 3, name: "Once-Off Cleaning", item: "https://www.cleaningprofessionals.com.au/services/once-off-cleaning" },
      ],
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://www.cleaningprofessionals.com.au/services/once-off-cleaning"
    }
  };
   
 

  return (
    <MainLayout>
      <div className="mt-28">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <RegularCleaningHero />
        <BeforeAfterGallery serviceSlug="once-off-cleaning" />
        <PricingStructure />
        <WhatsIncluded />
        {/* <FAQs /> */}
        <ReviewsSection />
        <FAQSection />
        <HomeLatestBlogs />
       
        {/* <RequestCallback service={service} /> */}
        
        <Subscription />
      </div>
    </MainLayout>
  );
}
