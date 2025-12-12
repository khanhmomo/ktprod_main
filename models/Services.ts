import mongoose from 'mongoose';

const ServicesSchema = new mongoose.Schema({
  heroTitle: {
    type: String,
    default: 'Our Services'
  },
  heroDescription: {
    type: String,
    default: 'Discover our comprehensive photography and videography packages for your special day.'
  },
  heroImageUrl: {
    type: String,
    default: 'https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/494737167_1135629205034724_2926229135502320159_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=127cfc&_nc_ohc=xwzJ14FSvgcQ7kNvwEVZ_5D&_nc_oc=AdlKZx7BJDGTprTKOTnzqgyPOZkstrZCntBz81a59wFqom9mU6uERFNWZPxKmpG3258&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=WjsNLW6uui5Bl07TLiW5pA&oh=00_Afbg4ZM_OBUpWB-F_3iRorQnXXB5hj1z3-blyIvOGgx00Q&oe=68D12EA6'
  },
  heroImageAlt: {
    type: String,
    default: 'Wedding photography'
  },
  photographyPackages: [{
    name: String,
    features: [String]
  }],
  videographyPackages: [{
    name: String,
    features: [String]
  }],
  addOns: [String],
  bookingProcess: [String],
  faqs: [{
    question: String,
    answer: String
  }]
}, {
  timestamps: true
});

export default mongoose.models.Services || mongoose.model('Services', ServicesSchema);
