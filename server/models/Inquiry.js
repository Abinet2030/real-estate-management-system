import json from '../lib/jsonModels.js';

const Inquiry = {
  find: async (filter = {}) => {
    return (await json.find('inquiries', filter)).map((i) => ({ ...i, _id: i._id || i.id }));
  },
  findOne: async (filter = {}) => {
    return json.findOne('inquiries', filter);
  },
  findById: async (id) => {
    return json.findById('inquiries', id);
  },
  create: async (data) => {
    return json.create('inquiries', data);
  },
  findByIdAndUpdate: async (id, update) => {
    return json.updateById('inquiries', id, update);
  },
  findByIdAndDelete: async (id) => {
    return json.deleteById('inquiries', id);
  },
  // instance save helper for route code that mutates returned object
  save: async (obj) => {
    return json.updateById('inquiries', obj._id || obj.id, obj);
  },
};

export default Inquiry;
