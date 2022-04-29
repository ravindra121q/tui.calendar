import { h } from 'preact';
import { useMemo } from 'preact/hooks';

import { GridHeader } from '@src/components/dayGridCommon/gridHeader';
import { AlldayGridRow } from '@src/components/dayGridWeek/alldayGridRow';
import { OtherGridRow } from '@src/components/dayGridWeek/otherGridRow';
import { Layout } from '@src/components/layout';
import { Panel } from '@src/components/panel';
import { TimeGrid } from '@src/components/timeGrid/timeGrid';
import { DEFAULT_WEEK_PANEL_TYPES } from '@src/constants/layout';
import { WEEK_DAYNAME_BORDER, WEEK_DAYNAME_HEIGHT } from '@src/constants/style';
import { useStore } from '@src/contexts/calendarStore';
import { cls } from '@src/helpers/css';
import { getDayNames } from '@src/helpers/dayName';
import { getVisibleEventCollection } from '@src/helpers/events';
import { createTimeGridData, getDayGridEvents, getWeekDates } from '@src/helpers/grid';
import { getDisplayPanel } from '@src/helpers/view';
import { useDOMNode } from '@src/hooks/common/useDOMNode';
import { useTimeGridScrollSync } from '@src/hooks/timeGrid/useTimeGridScrollSync';
import {
  calendarSelector,
  optionsSelector,
  viewSelector,
  weekViewLayoutSelector,
} from '@src/selectors';
import { primaryTimezoneSelector } from '@src/selectors/timezone';
import { getRowStyleInfo } from '@src/time/datetime';

import type { WeekOptions } from '@t/options';
import type { AlldayEventCategory } from '@t/panel';

function useWeekViewState() {
  const options = useStore(optionsSelector);
  const calendar = useStore(calendarSelector);
  const { dayGridRows: gridRowLayout } = useStore(weekViewLayoutSelector);
  const { renderDate } = useStore(viewSelector);
  const primaryTimezone = useStore(primaryTimezoneSelector);

  return useMemo(
    () => ({
      options,
      calendar,
      gridRowLayout,
      renderDate,
      primaryTimezone,
    }),
    [calendar, gridRowLayout, options, renderDate, primaryTimezone]
  );
}

export function Week() {
  const { options, calendar, gridRowLayout, renderDate, primaryTimezone } = useWeekViewState();
  const [timePanel, setTimePanelRef] = useDOMNode<HTMLDivElement>();

  const { eventView, taskView } = options;
  const weekOptions = options.week as Required<WeekOptions>;
  const { narrowWeekend, startDayOfWeek, workweek, hourStart, hourEnd } = weekOptions;
  const weekDates = useMemo(() => getWeekDates(renderDate, weekOptions), [renderDate, weekOptions]);
  const dayNames = getDayNames(weekDates);
  const { rowStyleInfo, cellWidthMap } = getRowStyleInfo(
    weekDates.length,
    narrowWeekend,
    startDayOfWeek,
    workweek
  );
  const calendarData = useMemo(
    () => ({
      ...calendar,
      events: getVisibleEventCollection(calendar.events, primaryTimezone),
    }),
    [calendar, primaryTimezone]
  );
  const eventByPanel = useMemo(
    () =>
      getDayGridEvents(weekDates, calendarData, {
        narrowWeekend,
        hourStart,
        hourEnd,
      }),
    [calendarData, hourEnd, hourStart, narrowWeekend, weekDates]
  );
  const timeGridData = useMemo(
    () =>
      createTimeGridData(weekDates, {
        hourStart: weekOptions.hourStart,
        hourEnd: weekOptions.hourEnd,
      }),
    [weekDates, weekOptions.hourEnd, weekOptions.hourStart]
  );

  const displayPanel = getDisplayPanel(taskView, eventView);
  const dayGridRows = displayPanel
    .filter((panel) => DEFAULT_WEEK_PANEL_TYPES.includes(panel))
    .map((key) => {
      const rowType = key as AlldayEventCategory;

      return (
        <Panel name={rowType} key={rowType} resizable>
          {rowType === 'allday' ? (
            <AlldayGridRow
              events={eventByPanel[rowType]}
              rowStyleInfo={rowStyleInfo}
              gridColWidthMap={cellWidthMap}
              weekDates={weekDates}
              height={gridRowLayout[rowType].height}
              options={weekOptions}
            />
          ) : (
            <OtherGridRow
              category={rowType}
              events={eventByPanel[rowType]}
              weekDates={weekDates}
              height={gridRowLayout[rowType].height}
              options={weekOptions}
              gridColWidthMap={cellWidthMap}
            />
          )}
        </Panel>
      );
    });

  useTimeGridScrollSync(timePanel, timeGridData.rows.length);

  return (
    <Layout className={cls('week-view')} autoAdjustPanels={true}>
      <Panel name="week-view-daynames" initialHeight={WEEK_DAYNAME_HEIGHT + WEEK_DAYNAME_BORDER}>
        <GridHeader
          dayNames={dayNames}
          marginLeft={120}
          templateType="weekDayname"
          options={weekOptions}
          rowStyleInfo={rowStyleInfo}
          type="week"
        />
      </Panel>
      {dayGridRows}
      <Panel name="time" autoSize={1} ref={setTimePanelRef}>
        <TimeGrid events={eventByPanel.time} timeGridData={timeGridData} />
      </Panel>
    </Layout>
  );
}