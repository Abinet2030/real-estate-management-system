import json from '../lib/jsonModels.js';

const User = {
  find: async (filter = {}) => {
    const items = await json.find('users', filter);
    return items;
  },
  findOne: async (filter = {}) => {
    return json.findOne('users', filter);
  },
  findById: async (id) => {
    return json.findById('users', id);
  },
  create: async (data) => {
    return json.create('users', data);
  },
  findByIdAndUpdate: async (id, update) => {
    return json.updateById('users', id, update);
  },
  findByIdAndDelete: async (id) => {
    return json.deleteById('users', id);
  },
};

export default User;
