# Agent 2: Search Debounce Test Plan

## Manual Testing Steps

### Test 1: Basic Debounce
1. Open any document in NaviDocs
2. Type "engine" in search box
3. **Expected**: See loading spinner appear after typing stops
4. **Expected**: Search executes 300ms after last keystroke
5. **Expected**: Results appear highlighted in document

### Test 2: Cancellation on New Input
1. Type "eng"
2. Wait 200ms (before search triggers)
3. Continue typing "ine"
4. **Expected**: Previous pending search is cancelled
5. **Expected**: New 300ms timer starts
6. **Expected**: Only one search executes (for "engine")

### Test 3: Minimum Query Length
1. Type "e" (1 character)
2. **Expected**: No search executes
3. **Expected**: No loading spinner
4. Type "n" (now "en", 2 characters)
5. **Expected**: Search triggers after 300ms
6. **Expected**: Results appear

### Test 4: Clear Search
1. Type "engine" and wait for results
2. Click the X (clear) button
3. **Expected**: Input clears immediately
4. **Expected**: Results clear immediately
5. **Expected**: No highlights remain

### Test 5: Backspace to < 2 Characters
1. Type "engine" and wait for results
2. Backspace to "en"
3. **Expected**: New search executes after 300ms
4. Backspace to "e"
5. **Expected**: Results clear immediately
6. **Expected**: No search executes

### Test 6: Loading Indicator
1. Type "engine"
2. **Expected**: Search button shows spinning icon
3. **Expected**: Button is disabled during search
4. **Expected**: Tooltip shows "Searching..."
5. Wait for search to complete
6. **Expected**: Search icon returns
7. **Expected**: Tooltip shows "Search"

### Test 7: Rapid Typing
1. Type "abcdefghijklmnop" quickly without pausing
2. **Expected**: Loading state appears
3. **Expected**: Only ONE search executes (after typing stops)
4. **Expected**: No multiple searches for intermediate strings

### Test 8: Enter Key Override
1. Type "eng" (3 characters)
2. Press Enter immediately (don't wait for debounce)
3. **Expected**: Search executes immediately
4. **Expected**: Debounce timer is bypassed

### Test 9: Multiple Cancel Operations
1. Type "test"
2. Before search executes, type "search"
3. Before that executes, clear input
4. **Expected**: No errors in console
5. **Expected**: All abort controllers cleaned up properly

### Test 10: Cross-Page Search Integration
1. Type "engine" and wait for results
2. **Expected**: Current page highlights appear
3. **Expected**: Background cross-page search starts
4. **Expected**: Total match count includes all pages
5. Navigate to next/previous match
6. **Expected**: Navigation works correctly

## Automated Test Scenarios (for future implementation)

```javascript
describe('Search Debounce', () => {
  it('should debounce search by 300ms', async () => {
    // Type characters
    await typeText('engine')

    // Verify search hasn't executed yet
    expect(performSearch).not.toHaveBeenCalled()

    // Wait 300ms
    await delay(300)

    // Verify search executed
    expect(performSearch).toHaveBeenCalledTimes(1)
  })

  it('should cancel previous search on new input', async () => {
    await typeText('eng')
    await delay(200)
    await typeText('ine')

    // Only one search should execute
    await delay(300)
    expect(performSearch).toHaveBeenCalledTimes(1)
    expect(performSearch).toHaveBeenCalledWith('engine')
  })

  it('should not search for queries < 2 chars', async () => {
    await typeText('e')
    await delay(300)

    expect(performSearch).not.toHaveBeenCalled()
  })

  it('should show loading indicator', async () => {
    await typeText('engine')

    expect(isSearching.value).toBe(true)
    expect(searchButton.querySelector('.animate-spin')).toBeInTheDocument()

    await delay(300)
    await waitFor(() => expect(isSearching.value).toBe(false))
  })
})
```

## Performance Verification

### Metrics to Check
- **Debounce delay**: Should be exactly 300ms
- **Search cancellation**: Previous searches should abort properly
- **Memory leaks**: No timers or controllers left hanging
- **UI responsiveness**: No lag during typing
- **Search execution**: Only one search per debounce period

### Console Checks
```javascript
// Should see ONE log after typing "engine":
console.log("Found X matches across Y pages")

// Should NOT see:
console.error("Search error:")
console.warn("Failed to abort search")
```

## Edge Cases

### Concurrent Operations
- ✅ Typing while previous search is running
- ✅ Clearing input while search is running
- ✅ Navigating away while search is running
- ✅ Closing document while search is running

### Boundary Conditions
- ✅ Empty string → No search
- ✅ 1 character → No search
- ✅ 2 characters → Search executes
- ✅ Very long query → Search executes normally

### State Cleanup
- ✅ Timer cleared on new input
- ✅ Abort controller cleared on completion
- ✅ Loading state reset on error
- ✅ All state reset on clear

## Success Criteria

✅ Search executes 300ms after user stops typing
✅ Loading indicator shows during search
✅ Previous searches cancel when new input arrives
✅ Results update in real-time
✅ Clearing input clears results immediately
✅ Queries < 2 characters don't trigger search
✅ No console errors
✅ No memory leaks
✅ Smooth user experience

## Known Limitations

1. **Debounce timing**: 300ms is hardcoded (could be configurable)
2. **Minimum query length**: 2 characters is hardcoded (could be configurable)
3. **No search history**: Previous searches not saved
4. **No smart cancellation**: Cancels even if query prefix matches

## Future Enhancements

1. Make debounce delay configurable via settings
2. Add search history dropdown
3. Implement smart cancellation (don't cancel if new query starts with old)
4. Add search suggestions/autocomplete
5. Persist search state across page navigation
6. Add keyboard shortcuts (Cmd+G for next match)
7. Add search within results filtering
