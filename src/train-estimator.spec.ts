import { TrainTicketEstimator } from './train-estimator';
import { InvalidTripInputException, Passenger, TripDetails, TripRequest } from './model/trip.request';
import { TicketPriceApi } from './external/ticket-price.service';
import { DiscountCard } from './model/trip.request';

describe('TrainTicketEstimator', () => {
  let currentDate = new Date();
  let estimator: TrainTicketEstimator;
  let ticketPriceApi: TicketPriceApi;
  let tripDetails: TripDetails;
  let passengers: Passenger[] = [];
  const invalidAgePassenger: Passenger = new Passenger(-5, []);
  const babyPassenger: Passenger = new Passenger(0.1, []);
  const minorPassenger: Passenger = new Passenger(12, []);
  const basicPassenger: Passenger = new Passenger(25, []);
  const seniorPassenger: Passenger = new Passenger(72, []);

  beforeEach(() => {
    ticketPriceApi = new TicketPriceApi();
    estimator = new TrainTicketEstimator(ticketPriceApi);
    jest.spyOn(ticketPriceApi, "getBasicRate").mockResolvedValue(100);
    tripDetails = {
      from: 'Bordeaux',
      to: 'Paris',
      when: new Date('2023-06-03T08:00:00Z'),
    };
  });

  afterEach(() => {
    passengers = [];
    currentDate = new Date();
  })

  describe('estimate', () => {

    it('should return 0 if no passengers', async () => {
        const tripRequest: TripRequest = { passengers: [], details: tripDetails };
        const result = await estimator.estimate(tripRequest);

        expect(result).toBe(0);
    });

    it('should throw an InvalidTripInputException if start city is invalid', async () => {
        const tripDetails = {
            from: '',
            to: 'Paris',
            when: new Date('2023-06-01T08:00:00Z'),
        };
        passengers.push(minorPassenger);
        const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
        const result = estimator.estimate(tripRequest);

        await expect(async() => await result).rejects.toThrowError(
            new InvalidTripInputException('Start city is invalid')
          );
    });
    
    it('should throw an InvalidTripInputException if destination city is invalid', async () => {
      passengers.push(minorPassenger);
        const tripDetails = {
            from: 'Bordeaux',
            to: '',
            when: new Date(),
        };
          const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
          const result = estimator.estimate(tripRequest);

          await expect(async() => await result).rejects.toThrowError(
            new InvalidTripInputException('Destination city is invalid')
          );
    });

    it('should throw an InvalidTripInputException if date is invalid', async () => {
      passengers.push(minorPassenger);
      const tripDetails = {
          from: 'Bordeaux',
          to: 'Paris',
          when: new Date('2000-01-01T10:10:10Z'),
      };
      const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
      const result = estimator.estimate(tripRequest);

      await expect(async() => await result).rejects.toThrowError(new InvalidTripInputException("Date is invalid"));
  });

  it('should throw an InvalidTripInputException if age is invalid', async () => {
    passengers.push(invalidAgePassenger);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
    const result = estimator.estimate(tripRequest);

    await expect(async() => await result).rejects.toThrowError(new InvalidTripInputException("Age is invalid"));
});

  });

  it('should calculate the correct ticket price for a single adult passenger', async () => {
    passengers.push(basicPassenger);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(112);
  });

  it('should calculate the correct ticket price for a single senior passenger', async () => {
    passengers.push(seniorPassenger);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(72);
  });

  it('should calculate the correct ticket price for a child under age of 1', async () => {
    passengers.push(babyPassenger);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(0);
  });

  it('should calculate the correct ticket price for a passenger who has a trainStroke card', async () => {
    const trainStrokePassenger: Passenger = {...basicPassenger, discounts :  [DiscountCard.TrainStroke]};
    passengers.push(trainStrokePassenger);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(1);
  });

  it('should calculate the correct ticket price for a couple of senior people', async () => {
    const alice: Passenger = {...seniorPassenger, discounts :  [DiscountCard.Senior, DiscountCard.Couple]};
    const fred: Passenger = {...seniorPassenger, discounts :  [DiscountCard.Senior]};
    passengers.push(alice, fred);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(64);
  });

  it('should calculate the correct ticket price for a single adult passenger with half-couple card', async () => {
    const alice: Passenger = {...basicPassenger, discounts : [DiscountCard.HalfCouple]};
    passengers.push(alice);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(102);
  });

  it('should calculate the correct ticket price for a single adult passenger with half-couple and senior card', async () => {
    const alice: Passenger = {...seniorPassenger, discounts : [DiscountCard.HalfCouple, DiscountCard.Senior]};
    passengers.push(alice);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(42);
  });

  it('should add a 20% discount when trip depart is in 30 days or more', async () => {
    const datePlusThrityDays: Date = new Date(currentDate.setDate(currentDate.getDate() + 30));
    tripDetails = {
      ...tripDetails,
      when: datePlusThrityDays,
    }
    passengers.push(basicPassenger);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails};
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(100);
  });

  it('should add a 18% discount when trip depart is in 29 days', async () => {
    const datePlusTwentyNineDays: Date = new Date(currentDate.setDate(currentDate.getDate() + 29));
    tripDetails = {
      ...tripDetails,
      when: datePlusTwentyNineDays,
    }
    passengers.push(basicPassenger);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails};
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(102);
  });

  it('should add a 30% discount when trip depart is 5 days before', async () => {
    const datePlusFiveDays: Date = new Date(currentDate.setDate(currentDate.getDate() + 5));
    tripDetails = {
      ...tripDetails,
      when: datePlusFiveDays,
    }
    passengers.push(basicPassenger);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails};
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(150);
  });

  
  it('should double the price of the ticket when trip depart is less than 5 days ', async () => {

    const dateLessThanFiveDays: Date = new Date(currentDate.setDate(currentDate.getDate() + 4));
    
    tripDetails = {
      ...tripDetails,
      when: dateLessThanFiveDays,
    }
    passengers.push(basicPassenger);
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails};
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(220);
  });

})