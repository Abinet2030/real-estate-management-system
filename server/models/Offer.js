import json from '../lib/jsonModels.js';

const Offer = {
  find: async (filter = {}) => {
    return await json.find('offers', filter);
  },
  findById: async (id) => json.findById('offers', id),
  create: async (data) => json.create('offers', data),
  save: async (obj) => json.updateById('offers', obj._id || obj.id, obj),
};

export default Offer;
