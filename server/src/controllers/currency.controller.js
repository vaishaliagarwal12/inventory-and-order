import * as currencyService from '../services/currency.service.js';

export const getRates = async (req, res, next) => {
  try {
    const data = await currencyService.getExchangeRates();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
