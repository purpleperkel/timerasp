# Time-Based Variable Intervals Feature

## Overview
TimelapsePI now supports time-based variable intervals, allowing you to automatically adjust the capture speed based on the time of day. This is perfect for capturing fast-changing periods like sunrise/sunset while saving storage during slower periods.

## How It Works

### Concept
Instead of using a single fixed interval throughout your timelapse, you can define different capture speeds for different time periods. The system automatically switches between intervals based on the current time.

### Common Use Cases

1. **Day/Night Timelapse**
   - Fast capture during sunrise (6-8 AM): 2-second intervals
   - Slower during day (8 AM-5 PM): 30-second intervals  
   - Fast capture during sunset (5-7 PM): 2-second intervals
   - Very slow at night (7 PM-6 AM): 60-second intervals

2. **Construction/Work Site**
   - Fast during work hours (8 AM-5 PM): 5-second intervals
   - Slow after hours (5 PM-8 AM): 60-second intervals

3. **Garden/Plant Growth**
   - Moderate during day (6 AM-8 PM): 10-second intervals
   - Slow at night (8 PM-6 AM): 120-second intervals

## Using the Feature

### In the Web UI

1. **Enable Variable Intervals**
   - Check the "Use time-based intervals" checkbox in the Timelapse Control panel
   - The time period configuration section will appear

2. **Add Time Periods**
   - Click "Add Time Period" to create a new interval rule
   - For each period, specify:
     - **Start Time**: When this interval period begins (24-hour format)
     - **End Time**: When this interval period ends
     - **Interval**: Capture interval in seconds for this period

3. **Example Configuration**
   ```
   Period 1: 06:00 - 08:00 → 2 seconds (sunrise)
   Period 2: 08:00 - 17:00 → 30 seconds (day)
   Period 3: 17:00 - 19:00 → 2 seconds (sunset)
   Period 4: 19:00 - 06:00 → 60 seconds (night)
   ```

4. **Default/Fallback Interval**
   - The "Default Interval" field serves as a fallback
   - Used when no time period matches the current time
   - Also used if variable intervals are disabled

### Important Notes

#### Overnight Periods
The system correctly handles periods that cross midnight. For example:
- A period from 22:00 to 06:00 will work correctly overnight

#### Time Gaps
If there are gaps in your schedule (times not covered by any period), the system will use the default interval during those times.

#### Overlapping Periods
The system validates against overlapping periods and will alert you if conflicts are detected. Each time should only belong to one period.

#### Real-Time Updates
The interval automatically adjusts as time progresses. You'll see the current active interval displayed in the stats panel during recording.

## Technical Details

### How Intervals Change

1. The system checks the current time against the schedule
2. When entering a new time period, the interval changes automatically
3. The change happens after the current capture completes
4. No frames are lost during the transition

### Schedule Validation

The system validates:
- No overlapping time periods
- Valid time format (HH:MM)
- Interval values are positive integers
- End time is after start time (for same-day periods)

### API Structure

When starting a timelapse with variable intervals, the API receives:

```json
{
  "interval": 5,
  "resolution": [1920, 1080],
  "use_variable_intervals": true,
  "interval_schedule": [
    {
      "start": "06:00",
      "end": "08:00",
      "interval": 2
    },
    {
      "start": "08:00",
      "end": "17:00",
      "interval": 30
    }
  ]
}
```

### Status Information

The status API returns additional fields when using variable intervals:

```json
{
  "active": true,
  "use_variable_intervals": true,
  "current_interval": 30,
  "interval_schedule": [...],
  "total_frames": 150
}
```

## Best Practices

### Planning Your Schedule

1. **Consider Your Subject**
   - Fast-moving subjects need shorter intervals
   - Static subjects can use longer intervals
   - Match intervals to the rate of change

2. **Storage Management**
   - Shorter intervals = more frames = more storage
   - Balance quality with available space
   - Night periods often need fewer frames

3. **Transition Periods**
   - Use shorter intervals during transitions (sunrise/sunset)
   - These are often the most interesting parts of a timelapse

### Example Schedules

#### Nature/Landscape
```
05:30 - 07:00: 2s  (dawn)
07:00 - 17:00: 20s (day)
17:00 - 18:30: 2s  (dusk)
18:30 - 05:30: 60s (night)
```

#### Urban/City
```
06:00 - 09:00: 3s  (morning rush)
09:00 - 16:00: 30s (day)
16:00 - 19:00: 3s  (evening rush)
19:00 - 06:00: 60s (night)
```

#### Indoor Plant Growth
```
06:00 - 20:00: 300s (5 min - day)
20:00 - 06:00: 600s (10 min - night)
```

## Troubleshooting

### Intervals Not Changing
- Check that "Use time-based intervals" is enabled
- Verify time periods are correctly configured
- Ensure system time is correct on Raspberry Pi

### Validation Errors
- Check for overlapping periods
- Ensure all times are in HH:MM format
- Verify interval values are positive numbers

### Performance
- Changing intervals doesn't affect capture quality
- No frames are dropped during transitions
- CPU usage remains constant regardless of interval

## Benefits

1. **Storage Optimization**: Capture more frames when needed, fewer when not
2. **Better Coverage**: Don't miss important moments while saving space
3. **Automatic Operation**: Set and forget - no manual intervention needed
4. **Flexible Scheduling**: Adapt to any scenario or subject
5. **Professional Results**: Create more dynamic timelapses with varying pace

## Future Enhancements

Potential improvements being considered:
- Sunrise/sunset time automation based on location
- Interval curves (gradual transitions between periods)
- Day-of-week scheduling
- Seasonal adjustments
- Motion-triggered interval changes
