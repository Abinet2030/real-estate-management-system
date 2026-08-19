import json from '../lib/jsonModels.js';

const InquiryMessage = {
  find: async (filter = {}) => {
    return await json.find('inquiryMessages', filter);
  },
  create: async (data) => {
    return json.create('inquiryMessages', data);
  },
};

export default InquiryMessage;
